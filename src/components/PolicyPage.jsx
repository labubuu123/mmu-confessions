import React from 'react'
import { Link } from 'react-router-dom'
import { Home, FileText, Check, AlertTriangle, Shield, Info } from 'lucide-react'

export default function PolicyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Community Guidelines & Policy
                    </h1>
                </div>

                <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">
                    <p className="text-lg">
                        Welcome to MMU Confessions. To ensure a safe and anonymous platform for all, you must agree to follow these rules. Please read them carefully before posting or commenting.
                    </p>

                    <Section icon={<Check />} title="General Conduct" titleCN="行为准则">
                        <Rule
                            en="Members must treat each other with respect and courtesy. No profanity, malicious slander, or personal attacks."
                            cn="1. 会员必须互相尊重，有礼貌交流，不污言秽语，不恶意中伤其他会员。"
                        />
                        <Rule
                            en="Supportive interaction and constructive discussion are encouraged."
                            cn="2. 我们鼓励会员之间互相支持，并进行建设性的讨论。"
                        />
                    </Section>

                    <Section icon={<AlertTriangle />} title="Strictly Prohibited" titleCN="严格禁止">
                        <Rule
                            en="No Bullying or Harassment: Do not attack, bully, or harass any individual or group."
                            cn="1. 禁止霸凌或骚扰：请勿攻击、霸凌或骚扰任何个人或团体。"
                        />
                        <Rule
                            en="No Hate Speech, Discrimination, or Politics: Content that promotes hatred, discrimination (based on race, ethnicity, religion, gender, etc.) or involves sensitive political topics is strictly forbidden."
                            cn="2. 禁止仇恨言论、歧视或政治：严禁止任何牵涉到歧视，政治或人身攻击的发言。"
                        />
                        <Rule
                            en="No Personal Information (PII): Do not post any personally identifiable information about yourself or others. This includes full names, phone numbers, addresses, social media profiles, or student IDs."
                            cn="3. 禁止个人信息：请勿发布任何关于您自己或他人的个人身份信息。这包括但不限于全名、电话号码、地址、社交媒体资料或学生证号。"
                        />
                        <Rule
                            en="No Advertising or Spam: Do not post advertisements, promotions, sales, rental listings, or any commercial solicitation unless explicitly approved by a moderator."
                            cn="4. 禁止广告或垃圾信息：除非版主同意/推荐，会员不能发广告、招商。拒绝一切宣传，卖东西，租房等等一切贴子。"
                        />
                        <Rule
                            en="No NSFW or Graphic Content: Do not post sexually explicit, pornographic, or excessively violent/gory content."
                            cn="5. 禁止色情或暴力内容：请勿发布任何色情、或过度暴力/血腥的内容。"
                        />
                    </Section>

                    <Section icon={<Info />} title="Content & Liability" titleCN="内容与责任">
                        <Rule
                            en="You are Responsible for Your Content: Per the Malaysian Constitution, every citizen is equal under the law. You are solely responsible for the content and comments you post."
                            cn="1. 为您的内容负责：根据马来西亚宪法，每一位公民在法律面前都受到平等对待。因此，每一位会员都必须对自己所发表的留言负责。"
                        />
                        <Rule
                            en="Verify Your Information: Please verify the accuracy of your information before posting. Do not blindly accept information you read."
                            cn="2. 核实您的信息：请在发布前查证其资讯的正确性，勿盲目採用。"
                        />
                        <Rule
                            en="Personal Opinions: All statements and comments represent only the opinion of the individual speaker and not the platform."
                            cn="3. 个人意见：群里的发言僅代表发言者的个人意見与建议。"
                        />
                    </Section>
                    
                    <Section icon={<Shield />} title="Moderation & Reporting" titleCN="版主权限与举报">
                        <Rule
                            en="Moderator's Rights: Moderators have the absolute right to process, delete, or hide any post/reply, without prior notice or reason."
                            cn="1. 版主权力：版主有绝对权力，在不需要给任何通知/警告/理由的情况下，处理或删除任何帖/回覆。"
                        />
                        <Rule
                            en="Reporting Content: You can report any post by clicking the flag icon (🚩) in the top-right corner."
                            cn="2. 举报内容：您可以通过点击帖子右上角的旗帜图标 (🚩) 来举报任何帖子。"
                        />
                    </Section>

                    <div className="space-y-4 rounded-lg bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Disclaimers & Submissions
                        </h3>
                        <p>
                            <strong>Disclaimer:</strong> The stance of MMU Confession does not represent the official stance of Multimedia University (MMU).
                            <br />
                            <span className="text-sm text-gray-500">本页的立场绝对不代表所有MMU大学的立场。</span>
                        </p>
                    </div>

                    <div className="text-center pt-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
                        >
                            <Home className="w-4 h-4" />
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Section({ icon, title, titleCN, children }) {
    return (
        <section>
            <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                    {React.cloneElement(icon, { className: "w-6 h-6" })}
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 m-0">
                        {title}
                    </h2>
                    <p className="text-lg text-indigo-600 dark:text-indigo-400 m-0">{titleCN}</p>
                </div>
            </div>
            <ul className="list-none space-y-3 pl-0">
                {children}
            </ul>
        </section>
    )
}

function Rule({ en, cn }) {
    return (
        <li className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="font-medium m-0">{en}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">{cn}</p>
        </li>
    )
}