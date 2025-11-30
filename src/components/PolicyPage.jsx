import React from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, Check, AlertTriangle, Shield, Info, ArrowLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function PolicyPage() {
    const navigate = useNavigate();

    return (
        <>
            <Helmet>
                <title>Community Guidelines & Privacy Policy - MMU Confessions</title>
                <meta name="description" content="Read our community rules, privacy policy, and safety guidelines. We are committed to maintaining a safe, anonymous environment for all MMU students." />
            </Helmet>

            <div className="max-w-3xl mx-auto px-4 py-4 sm:py-12">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-4 sm:hidden hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Community Guidelines
                        </h1>
                    </div>

                    <div className="prose dark:prose-invert max-w-none space-y-6 sm:space-y-8 text-gray-700 dark:text-gray-300">
                        <p className="text-sm sm:text-lg">
                            Welcome to MMU Confessions. To ensure a safe and anonymous platform for all, you must agree to follow these rules. Please read them carefully before posting or commenting.
                        </p>

                        <Section icon={<Check />} title="General Conduct" titleCN="行为准则">
                            <Rule
                                en="Members must treat each other with respect and courtesy. No profanity, malicious slander, or personal attacks."
                                cn="会员必须互相尊重，有礼貌交流，不污言秽语，不恶意中伤其他会员。"
                            />
                            <Rule
                                en="Supportive interaction and constructive discussion are encouraged."
                                cn="我们鼓励会员之间互相支持，并进行建设性的讨论。"
                            />
                        </Section>

                        <Section icon={<AlertTriangle />} title="Strictly Prohibited" titleCN="严格禁止">
                            <Rule
                                en="No Bullying or Harassment: Do not attack, bully, or harass any individual or group."
                                cn="禁止霸凌或骚扰：请勿攻击、霸凌或骚扰任何个人或团体。"
                            />
                            <Rule
                                en="No Hate Speech, Discrimination, or Politics: Content that promotes hatred, discrimination (based on race, ethnicity, religion, gender, etc.) or involves sensitive political topics is strictly forbidden."
                                cn="禁止仇恨言论、歧视或政治：严禁止任何牵涉到歧视，政治或人身攻击的发言。"
                            />
                            <Rule
                                en="No Personal Information (PII): Do not post any personally identifiable information about yourself or others."
                                cn="禁止个人信息：请勿发布任何关于您自己或他人的个人身份信息。"
                            />
                            <Rule
                                en="No Advertising or Spam: Do not post advertisements, promotions, or commercial solicitation unless approved."
                                cn="禁止广告或垃圾信息：除非版主同意/推荐，会员不能发广告、招商。"
                            />
                        </Section>

                        <Section icon={<Heart />} title="Matchmaker Rules" titleCN="配对功能守则">
                            <Rule
                                en="Authenticity Required: All profile details (Age, Gender, etc.) must be accurate. Impersonation or fake profiles will be banned."
                                cn="必须真实：所有个人资料（年龄、性别等）必须准确。冒充或虚假档案将被封禁。"
                            />
                            <Rule
                                en="Privacy First: Do not share contact info (Instagram) in your public Bio. Use the 'Secret Contact' field only."
                                cn="隐私优先：请勿在公开简介中分享联系方式。请仅使用“秘密联系方式”栏位。"
                            />
                            <Rule
                                en="Safe Interactions: Harassment, stalking, or inappropriate behavior towards matches is strictly prohibited."
                                cn="安全互动：严禁对配对对象进行骚扰、跟踪或不当行为。"
                            />
                        </Section>

                        <Section icon={<Info />} title="Content & Liability" titleCN="内容与责任">
                            <Rule
                                en="You are Responsible for Your Content: Every citizen is equal under the law. You are solely responsible for your posts."
                                cn="为您的内容负责：每一位会员都必须对自己所发表的留言负责。"
                            />
                        </Section>

                        <Section icon={<Shield />} title="Moderation & Reporting" titleCN="版主权限与举报">
                            <Rule
                                en="Moderator's Rights: Moderators have the right to process, delete, or hide any post without prior notice."
                                cn="版主权力：版主有绝对权力，在不需要给任何通知的情况下，处理或删除任何帖。"
                            />
                            <Rule
                                en="Reporting Content: You can report posts by clicking the flag icon (🚩)."
                                cn="举报内容：您可以通过点击帖子的旗帜图标来举报。"
                            />
                        </Section>

                        <div className="p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm sm:text-base">
                                <strong>Disclaimer:</strong> MMU Confession does not represent the official stance of Multimedia University (MMU).
                            </p>
                        </div>

                        <div className="text-center pt-4">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition text-sm sm:text-base"
                            >
                                <Home className="w-4 h-4" />
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function Section({ icon, title, titleCN, children }) {
    return (
        <section>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                    {React.cloneElement(icon, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 m-0">
                        {title}
                    </h2>
                    <p className="text-base sm:text-lg text-indigo-600 dark:text-indigo-400 m-0">{titleCN}</p>
                </div>
            </div>
            <ul className="list-none space-y-2 sm:space-y-3 pl-0">
                {children}
            </ul>
        </section>
    );
}

function Rule({ en, cn }) {
    return (
        <li className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="font-medium m-0 text-sm sm:text-base">{en}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 m-0 mt-1">{cn}</p>
        </li>
    );
}