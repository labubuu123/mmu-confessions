import { useEffect } from "react";

export function useChallengeTracking() {
    useEffect(() => {
    function handleChallengeProgress(event) {
        const { action } = event.detail;
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem("challengeDate");

        if (savedDate === today) {
        const progress = JSON.parse(
            localStorage.getItem("challengeProgress") || "{}"
        );

        if (action.type === "post") {
            progress["post_positive"] = (progress["post_positive"] || 0) + 1;

            const hour = new Date().getHours();
            if (hour >= 22 || hour <= 2) {
            progress["evening_post"] = (progress["evening_post"] || 0) + 1;
            }
            if (hour >= 6 && hour <= 9) {
            progress["morning_post"] = (progress["morning_post"] || 0) + 1;
            }
        } else if (action.type === "comment") {
            progress["help_others"] = (progress["help_others"] || 0) + 1;
        } else if (action.type === "reaction") {
            progress["react_to_posts"] = (progress["react_to_posts"] || 0) + 1;
        } else if (action.type === "poll") {
            progress["use_poll"] = (progress["use_poll"] || 0) + 1;
        }

        localStorage.setItem("challengeProgress", JSON.stringify(progress));

        window.dispatchEvent(new CustomEvent("challengeUpdate"));
        }
    }

    window.addEventListener("challengeProgress", handleChallengeProgress);

    return () => {
        window.removeEventListener("challengeProgress", handleChallengeProgress);
    };
    }, []);
}
