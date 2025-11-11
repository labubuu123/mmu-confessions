import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostCard from './PostCard'
import { Search, X, Hash, TrendingUp } from 'lucide-react'

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [trendingTags, setTrendingTags] = useState([])
    const [selectedTag, setSelectedTag] = useState(null)

    useEffect(() => {
        fetchTrendingTags()
    }, [])

    useEffect(() => {
        if (query.length > 2 || selectedTag) {
            const timer = setTimeout(() => {
                search()
            }, 500)
            return () => clearTimeout(timer)
        } else if (query.length === 0 && !selectedTag) {
            setResults([])
        }
    }, [query, selectedTag])

    async function fetchTrendingTags() {
        const { data } = await supabase
            .from('confessions')
            .select('tags')
            .eq('approved', true)
            .limit(100)

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
                .slice(0, 10)
                .map(([tag]) => tag)

            setTrendingTags(sorted)
        }
    }

    async function search() {
        setLoading(true)
        
        let query_builder = supabase
            .from('confessions')
            .select('*')
            .eq('approved', true)
            .order('created_at', { ascending: false })
            .limit(50)

        if (selectedTag) {
            query_builder = query_builder.contains('tags', [selectedTag])
        } else if (query) {
            const lowerQuery = query.toLowerCase()
            if (lowerQuery === 'anonymous') {
                query_builder = query_builder.or(
                    `text.ilike.%${query}%,author_name.is.null`
                )
            } else {
                query_builder = query_builder.or(
                    `text.textSearch.'${query}',author_name.ilike.%${query}%`,
                    { textSearchOptions: { config: 'english', type: 'websearch' } }
                )
            }
        }

        const { data } = await query_builder
        setResults(data || [])
        setLoading(false)
    }

    const handleTagClick = (tag) => {
        setSelectedTag(tag === selectedTag ? null : tag)
        setQuery('')
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl">
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

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSelectedTag(null)
                        }}
                        placeholder="Search confessions..."
                        className="w-full pl-12 pr-12 py-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 dark:text-gray-100"
                    />
                    {(query || selectedTag) && (
                        <button
                            onClick={() => {
                                setQuery('')
                                setSelectedTag(null)
                                setResults([])
                            }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    )}
                </div>

                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Trending Tags
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendingTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                                    selectedTag === tag
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                                }`}
                            >
                                <Hash className="w-3 h-3" />
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : results.length > 0 ? (
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Found {results.length} {results.length === 1 ? 'confession' : 'confessions'}
                    </p>
                    {results.map(post => (
                        <PostCard key={post.id} post={post} onOpen={() => {}} />
                    ))}
                </div>
            ) : (query || selectedTag) ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-500 dark:text-gray-400">
                        No confessions found
                    </p>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3">👆</div>
                    <p className="text-gray-500 dark:text-gray-400">
                        Start typing or click a tag to search
                    </p>
                </div>
            )}
        </div>
    )
}