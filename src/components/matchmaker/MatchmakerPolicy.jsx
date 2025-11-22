import React, { useState, useRef } from 'react';
import { Shield, AlertTriangle, Heart, Eye, Lock, UserX, CheckCircle2, ScrollText, Scale } from 'lucide-react';

export default function MatchmakerPolicy({ onAccept, onCancel }) {
    const [canAccept, setCanAccept] = useState(false);
    const contentRef = useRef(null);

    const handleScroll = (e) => {
        const element = e.target;
        if (element.scrollHeight - element.scrollTop - element.clientHeight < 50) {
            setCanAccept(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <ScrollText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Matchmaker Rules</h2>
                            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">交友功能守则</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50 dark:bg-gray-900/50 scroll-smooth"
                >
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-2xl flex gap-3">
                        <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                        <div className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
                            <p className="mb-1"><strong>Welcome to MMU Matchmaker.</strong> This is a safe space for students to connect. To protect everyone, we strictly enforce the following policies.</p>
                            <p className="opacity-80">欢迎来到 MMU Matchmaker。这是一个安全的交友空间。为了保护大家，我们将严格执行以下政策。</p>
                        </div>
                    </div>

                    <PolicySection icon={<Lock />} title="1. Privacy & Anonymity" titleCN="隐私与匿名" color="text-blue-600">
                        <ul className="list-disc pl-5 space-y-4 text-sm text-gray-700 dark:text-gray-300 marker:text-blue-500">
                            <li>
                                <p className="font-medium">No Profile Picture Required. Your avatar is auto-generated to maintain anonymity.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">无需上传头像。系统将自动生成头像以保护您的隐私。</p>
                            </li>
                            <li>
                                <p className="font-medium">This system has NO chatting function. It only sends a "Match Request".</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">本系统无聊天功能。仅提供发送“配对请求”的功能。</p>
                            </li>
                            <li>
                                <p className="font-medium">Your "Secret Contact" (IG) is ONLY revealed if BOTH sides match.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">只有在双方都点击“喜欢”配对成功后，才会向对方显示您的“秘密联系方式”。</p>
                            </li>
                            <li>
                                <p className="font-medium">Do NOT post contact info in your public Bio.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">请勿在公开简介中填写联系方式。违规者将被拒绝申请。</p>
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection icon={<UserX />} title="2. Honest Profiles Only" titleCN="诚实交友" color="text-purple-600">
                        <ul className="list-disc pl-5 space-y-4 text-sm text-gray-700 dark:text-gray-300 marker:text-purple-500">
                            <li>
                                <p className="font-medium">All profiles are reviewed by Admin. Fake or "Joke" identities will be rejected.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">所有档案均由管理员审核。虚假、恶搞或乱填的档案将被直接拒绝。</p>
                            </li>
                            <li>
                                <p className="font-medium">Catfishing and Impersonation are strictly prohibited.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">严禁冒充他人或虚构身份。</p>
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection icon={<Heart />} title="3. Respect & Consent" titleCN="尊重与同意" color="text-pink-600">
                        <ul className="list-disc pl-5 space-y-4 text-sm text-gray-700 dark:text-gray-300 marker:text-pink-500">
                            <li>
                                <p className="font-medium">Zero Tolerance for Harassment. If someone rejects you, leave them alone.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">对骚扰零容忍。如果对方拒绝了你，请勿纠缠。</p>
                            </li>
                            <li>
                                <p className="font-medium">No unsolicited explicit content.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">禁止发送不雅内容。请保持尊重的氛围。</p>
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection icon={<Scale />} title="4. Legal & Compliance" titleCN="法律与合规" color="text-red-600">
                        <ul className="list-disc pl-5 space-y-4 text-sm text-gray-700 dark:text-gray-300 marker:text-red-500">
                            <li>
                                <p className="font-medium"><strong>Comm. & Multimedia Act 1998 (Section 233):</strong> Sharing offensive, menacing, or false content is a criminal offense.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">根据《1998年通讯与多媒体法》第233条文，发布攻击性、威胁或虚假内容属刑事犯罪。</p>
                            </li>
                            <li>
                                <p className="font-medium"><strong>Penal Code (Section 509):</strong> Insulting modesty or sexual harassment is punishable by law.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">根据《刑法典》第509条文，侮辱他人尊严或性骚扰将受到法律制裁。</p>
                            </li>
                            <li>
                                <p className="font-medium"><strong>Penal Code (Section 416):</strong> Cheating by personation (catfishing) is a crime.</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">根据《刑法典》第416条文，冒充他人身份进行欺诈属犯罪行为。</p>
                            </li>
                        </ul>
                    </PolicySection>

                    <div className="p-6 mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Violation Consequences / 违规后果</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Violating these rules will lead to a <strong>permanent ban</strong> and potential police report.
                            <br />
                            违反规则将导致<strong>永久封禁</strong>，严重者将被报警处理。
                        </p>
                    </div>
                    <div className="h-8"></div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-20">
                    {!canAccept && (
                        <p className="text-center text-xs text-gray-400 mb-3 animate-pulse font-medium">
                            ⬇️ Please scroll to the bottom to proceed / 请滑到底部以继续
                        </p>
                    )}
                    <button
                        onClick={onAccept}
                        disabled={!canAccept}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform
                        ${canAccept
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl hover:-translate-y-1 cursor-pointer'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-70'}`}
                    >
                        {canAccept ? (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                <span>I Understand & Agree</span>
                            </>
                        ) : (
                            <span>Read All to Agree</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PolicySection({ icon, title, titleCN, color, children }) {
    return (
        <section>
            <div className={`flex items-center gap-3 mb-3 ${color}`}>
                {React.cloneElement(icon, { className: "w-6 h-6" })}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{title}</h3>
                    <p className="text-sm font-medium opacity-80">{titleCN}</p>
                </div>
            </div>
            {children}
        </section>
    );
}