import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostCard from './PostCard'
import PostModal from './PostModal'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, X, Hash, TrendingUp, Filter, Calendar, Sparkles } from 'lucide-react'

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [trendingTags, setTrendingTags] = useState([])
    const [selectedTag, setSelectedTag] = useState(null)
    const [sortBy, setSortBy] = useState('recent')
    const [filterBy, setFilterBy] = useState('all')
    const [showFilters, setShowFilters] = useState(false)
    const [searchSuggestions, setSearchSuggestions] = useState([])

    const navigate = useNavigate()
    const { id: modalPostId } = useParams()

    useEffect(() => {
        fetchTrendingTags()
        loadSearchHistory()
    }, [])

    useEffect(() => {
        if (query.length > 1 || selectedTag) {
            const timer = setTimeout(() => {
                search()
                saveSearchHistory(query)
            }, 300)
            return () => clearTimeout(timer)
        } else if (query.length === 0 && !selectedTag) {
            setResults([])
        }
    }, [query, selectedTag, sortBy, filterBy])

    async function fetchTrendingTags() {
        const { data } = await supabase
            .from('confessions')
            .select('tags')
            .eq('approved', true)
            .limit(200)

        if (data) {
            const tagCount = {}
            data.forEach(post => {
                if (post.tags) {
                    post.tags.forEach(tag => {
                        tagCount[tag] = (tagCount[tag] || 0) + 1
                    })
                }
            })

            const sorted = Object.entries(tagCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15)
                .map(([tag]) => tag)

            setTrendingTags(sorted)
        }
    }

    function loadSearchHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
            setSearchSuggestions(history.slice(0, 5))
        } catch (e) {
            setSearchSuggestions([])
        }
    }

    function saveSearchHistory(searchQuery) {
        if (!searchQuery || searchQuery.length < 2) return
        
        try {
            let history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
            history = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, 10)
            localStorage.setItem('searchHistory', JSON.stringify(history))
            setSearchSuggestions(history.slice(0, 5))
        } catch (e) {
            console.error('Failed to save search history:', e)
        }
    }

    async function search() {
        setLoading(true)
        
        try {
            let query_builder = supabase
                .from('confessions')
                .select('*')
                .eq('approved', true)

            if (selectedTag) {
                query_builder = query_builder.contains('tags', [selectedTag])
            }
            else if (query) {
                const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0)
                
                if (searchTerms.length === 1) {
                    const term = searchTerms[0]
                    query_builder = query_builder.or(
                        `text.ilike.%${term}%,tags.cs.{${term}}`
                    )
                } else {
                    const conditions = searchTerms.map(term =>
                        `text.ilike.%${term}%`
                    ).join(',')
                    query_builder = query_builder.or(conditions)
                }
            }

            if (filterBy === 'popular') {
                query_builder = query_builder.gte('likes_count', 10)
            } else if (filterBy === 'discussed') {
                query_builder = query_builder.gte('comments_count', 5)
            } else if (filterBy === 'new') {
                const threeDaysAgo = new Date()
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
                query_builder = query_builder.gte('created_at', threeDaysAgo.toISOString())
            }

            if (sortBy === 'recent') {
                query_builder = query_builder.order('created_at', { ascending: false })
            } else if (sortBy === 'popular') {
                query_builder = query_builder.order('likes_count', { ascending: false })
            } else if (sortBy === 'discussed') {
                query_builder = query_builder.order('comments_count', { ascending: false })
            } else if (sortBy === 'relevance' && query && !selectedTag) {
                query_builder = query_builder.order('created_at', { ascending: false })
            }

            query_builder = query_builder.limit(100)

            const { data, error } = await query_builder

            if (error) throw error

            let processedResults = data || []

            if (sortBy === 'relevance' && query && !selectedTag && processedResults.length > 0) {
                const searchTerms = query.toLowerCase().trim().split(/\s+/)
                
                processedResults = processedResults.map(post => {
                    let score = 0
                    const postText = post.text.toLowerCase()
                    const postTags = (post.tags || []).join(' ').toLowerCase()
                    
                    searchTerms.forEach(term => {
                        const wordRegex = new RegExp(`\\b${term}\\b`, 'i')
                        if (wordRegex.test(postText)) score += 20
                        else if (postText.includes(term)) score += 10
                        
                        if (postTags.includes(term)) score += 30
                        
                        if (postText.startsWith(term)) score += 15
                    })
                    
                    const matchCount = searchTerms.filter(term =>
                        postText.includes(term) || postTags.includes(term)
                    ).length
                    score += matchCount * 5

                    const ageInDays = (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60 * 24)
                    if (ageInDays < 7) score += 5
                    score += Math.min(post.likes_count || 0, 20) * 0.5
                    
                    return { ...post, searchScore: score }
                })
                
                processedResults.sort((a, b) => b.searchScore - a.searchScore)
            }

            setResults(processedResults)
        } catch (err) {
            console.error('Search error:', err)
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    const handleTagClick = (tag) => {
        setSelectedTag(tag === selectedTag ? null : tag)
        setQuery('')
    }

    function handleOpenModal(post) {
        navigate(`/post/${post.id}`)
    }

    function handleCloseModal() {
        navigate('/search')
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl shadow-lg">
                        <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Search Confessions
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Find confessions by keywords or tags
                        </p>
                    </div>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSelectedTag(null)
                        }}
                        placeholder="Search confessions... (try: study, food, help, stress)"
                        className="w-full pl-12 pr-12 py-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 dark:text-gray-100 shadow-sm"
                    />
                    {(query || selectedTag) && (
                        <button
                            onClick={() => {
                                setQuery('')
                                setSelectedTag(null)
                                setResults([])
                            }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition z-10"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    )}
                </div>

                {!query && !selectedTag && searchSuggestions.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Recent Searches</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {searchSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setQuery(suggestion)}
                                    className="text-xs px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition border border-gray-200 dark:border-gray-700"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-2 mb-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                            showFilters || filterBy !== 'all'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filters</span>
                        {filterBy !== 'all' && (
                            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        )}
                    </button>

                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            {query && !selectedTag && <option value="relevance">Most Relevant</option>}
                            <option value="recent">Most Recent</option>
                            <option value="popular">Most Liked</option>
                            <option value="discussed">Most Discussed</option>
                        </select>
                    </div>
                </div>

                {showFilters && (
                    <div className="mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show only:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'all', label: 'All Posts', icon: '📝' },
                                { value: 'popular', label: 'Popular', icon: '🔥', desc: '10+ likes' },
                                { value: 'discussed', label: 'Discussed', icon: '💬', desc: '5+ comments' },
                                { value: 'new', label: 'New', icon: '✨', desc: 'Last 3 days' }
                            ].map(filter => (
                                <button
                                    key={filter.value}
                                    onClick={() => setFilterBy(filter.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        filterBy === filter.value
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span className="mr-1">{filter.icon}</span>
                                    {filter.label}
                                    {filter.desc && filterBy === filter.value && (
                                        <span className="ml-1 text-xs opacity-80">({filter.desc})</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Trending Tags
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendingTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    selectedTag === tag
                                        ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 hover:scale-105'
                                }`}
                            >
                                <Hash className="w-3 h-3" />
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p>
                </div>
            ) : results.length > 0 ? (
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{results.length}</span> {results.length === 1 ? 'confession' : 'confessions'} found
                        </p>
                        {selectedTag && (
                            <span className="flex items-center gap-1 text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                                <Hash className="w-3 h-3" />
                                {selectedTag}
                            </span>
                        )}
                    </div>
                    <div className="space-y-4">
                        {results.map(post => (
                            <PostCard key={post.id} post={post} onOpen={handleOpenModal} />
                        ))}
                    </div>
                </div>
            ) : (query || selectedTag) ? (
                <div className="text-center py-16">
                    <div className="text-7xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No confessions found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Try different keywords or tags
                    </p>
                    <button
                        onClick={() => {
                            setQuery('')
                            setSelectedTag(null)
                            setFilterBy('all')
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Clear Search
                    </button>
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="text-7xl mb-4">👆</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Start searching
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Type keywords or click a trending tag to discover confessions
                    </p>
                </div>
            )}

            {modalPostId && (
                <PostModal
                    postId={modalPostId}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    )
}