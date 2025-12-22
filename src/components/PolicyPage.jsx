import React from 'react';
import { Link } from 'react-router-dom';
import {
    Home, FileText, Check, AlertTriangle, Shield, Info, ArrowLeft,
    Heart, ShoppingBag, MapPin, Calendar, Sparkles, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function PolicyPage() {
    const navigate = useNavigate();

    return (
        <>
            <Helmet>
                <title>Community Guidelines & Privacy Policy - MMU Confessions</title>
                <meta name="description" content="Comprehensive community rules, marketplace policies, and safety guidelines for MMU Confessions." />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 py-4 sm:py-12">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-4 sm:hidden hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
                            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
                                Community Guidelines
                            </h1>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                                Effective Date: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <p className="text-sm sm:text-base font-medium m-0">
                                Welcome to MMU Confessions. This platform is a community-driven space. By using any feature (Confessions, Matchmaker, Marketplace, etc.), you agree to these binding rules. Violations may result in content removal or permanent bans.
                            </p>
                        </div>

                        <Section icon={<Shield />} title="General Conduct & Confessions" titleCN="行为准则与告白">
                            <Rule
                                en="Respect & Courtesy: Treat fellow students with respect. No profanity, malicious slander, or personal attacks directed at specific individuals."
                                cn="尊重与礼貌：请尊重其他同学。禁止针对特定个人的污言秽语、恶意中伤或人身攻击。"
                            />
                            <Rule
                                en="Zero Tolerance for Hate Speech: Content promoting hatred based on race, religion, gender, or sexual orientation is strictly prohibited."
                                cn="零容忍仇恨言论：严禁发布基于种族、宗教、性别或性取向的仇恨内容。"
                            />
                            <Rule
                                en="No Personal Information (Doxxing): Do not reveal names, student IDs, phone numbers, or private addresses of others."
                                cn="禁止泄露隐私 (起底)：请勿公开他人的姓名、学号、电话号码或私人地址。"
                            />
                            <Rule
                                en="Sensitive Content: Use the appropriate warnings/tags for sensitive topics. Explicit NSFW content is not allowed."
                                cn="敏感内容：请为敏感话题使用适当的警告/标签。禁止发布露骨的色情内容。"
                            />
                        </Section>

                        <Section icon={<Heart />} title="Matchmaker Guidelines" titleCN="配对功能守则">
                            <Rule
                                en="Authenticity Required: Profiles must represent a real person. Impersonation (catfishing) is a bannable offense."
                                cn="必须真实：个人资料必须代表真实本人。冒充他人（Catfishing）将被封禁。"
                            />
                            <Rule
                                en="Consent & Safety: 'No' means no. Harassment, stalking, or unwanted pursuit of matched users is strictly forbidden."
                                cn="同意与安全：“不”就是不。严禁骚扰、跟踪或纠缠配对用户。"
                            />
                            <Rule
                                en="Privacy Protection: Do not share your contact details (Instagram/WhatsApp) in your public Bio. Use the designated 'Secret Contact' field."
                                cn="隐私保护：请勿在公开简介中分享联系方式。请仅使用指定的“秘密联系方式”栏位。"
                            />
                        </Section>

                        <Section icon={<ShoppingBag />} title="Marketplace Rules" titleCN="二手市场规则">
                            <Rule
                                en="Legal Items Only: Selling drugs, weapons, stolen goods, or academic dishonesty services (e.g., assignment writing) is illegal and prohibited."
                                cn="仅限合法物品：禁止出售毒品、武器、赃物或学术欺诈服务（如代写作业）。"
                            />
                            <Rule
                                en="Honest Descriptions: Sellers must accurately describe the condition of items. Misleading listings will be removed."
                                cn="诚实描述：卖家必须准确描述物品状况。误导性商品将被移除。"
                            />
                            <Rule
                                en="Safe Transactions: We recommend meeting in safe, public locations on campus (e.g., Library, Student Center). Avoid secluded areas."
                                cn="安全交易：建议在校园内的安全公共场所（如图书馆、学生活动中心）交易。避免僻静区域。"
                            />
                            <Rule
                                en="Platform Liability: MMU Confessions is not responsible for financial losses or disputes. Trade at your own risk."
                                cn="平台责任：MMU Confessions 不对经济损失或纠纷负责。交易风险自负。"
                            />
                        </Section>

                        <Section icon={<MapPin />} title="Lost & Found" titleCN="失物招领">
                            <Rule
                                en="Verify Ownership: When claiming an item, be prepared to provide proof (e.g., unlock phone, describe unique markings)."
                                cn="核实所有权：认领物品时，请准备好提供证明（如解锁手机、描述独特标记）。"
                            />
                            <Rule
                                en="Protect Identities: If you find an ID card or Wallet, DO NOT post the full unblurred image. Blur sensitive numbers."
                                cn="保护身份：如果您捡到身份证或钱包，请勿发布未打码的完整照片。请模糊处理敏感号码。"
                            />
                        </Section>

                        <Section icon={<Calendar />} title="Events & Polls" titleCN="活动与投票">
                            <Rule
                                en="Legitimate Events: Events must be relevant to student life. No unauthorized commercial solicitation or political rallies."
                                cn="合法活动：活动必须与学生生活相关。禁止未经授权的商业拉票或政治集会。"
                            />
                            <Rule
                                en="Unbiased Polls: Polls designed to bully, shame, or target specific individuals are prohibited."
                                cn="公正投票：禁止发起旨在霸凌、羞辱 or 针对特定个人的投票。"
                            />
                        </Section>

                        <Section icon={<Sparkles />} title="AI Tools Usage" titleCN="AI 工具使用">
                            <Rule
                                en="User Responsibility: Content generated by AI tools (Rewrite, Memeify) is posted under your responsibility. Review it before posting."
                                cn="用户责任：使用 AI 工具（重写、表情包）生成的内容由您负责。发布前请务必审查。"
                            />
                            <Rule
                                en="Accuracy: AI Viral Checks and analyses are estimates for fun and not guaranteed metrics."
                                cn="准确性：AI 病毒式传播检测和分析仅供娱乐估算，不保证准确性。"
                            />
                        </Section>

                        <Section icon={<Lock />} title="Privacy & Data" titleCN="隐私与数据">
                            <Rule
                                en="Anonymous ID: We generate a random 'Anon ID' stored on your device to track your stats. Clearing browser cache will reset your identity."
                                cn="匿名 ID：我们在您的设备上生成随机 'Anon ID' 以追踪您的统计数据。清除浏览器缓存将重置您的身份。"
                            />
                            <Rule
                                en="Data Rights: We do not sell your personal data. Confessions are public domain once posted."
                                cn="数据权利：我们不出售您的个人数据。告白一旦发布即视为公共领域内容。"
                            />
                        </Section>

                        <div className="mt-8 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                            <p className="text-sm sm:text-base flex gap-2">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <span>
                                    <strong>Disclaimer:</strong> MMU Confessions is a student-run community project and does not represent the official stance of Multimedia University (MMU).
                                </span>
                            </p>
                        </div>

                        <div className="text-center pt-8">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-200 dark:shadow-none"
                            >
                                <Home className="w-5 h-5" />
                                I Agree & Return Home
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
        <section className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-indigo-600 dark:text-indigo-400">
                    {React.cloneElement(icon, { className: "w-6 h-6" })}
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white m-0 leading-tight">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 m-0 font-medium">{titleCN}</p>
                </div>
            </div>
            <ul className="grid gap-3 list-none pl-0">
                {children}
            </ul>
        </section>
    );
}

function Rule({ en, cn }) {
    return (
        <li className="relative group overflow-hidden p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="font-semibold text-gray-900 dark:text-gray-200 text-sm sm:text-base leading-relaxed">{en}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{cn}</p>
        </li>
    );
}