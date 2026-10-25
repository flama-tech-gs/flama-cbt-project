// backend/portalActivated.js
// Reads the result saved by setupSchoolUrl.js and fills existing page IDs.

document.addEventListener("DOMContentLoaded", () => {
    const schoolNameElement = document.getElementById("schoolName");
    const schoolEmailElement = document.getElementById("schoolEmail");
    const portalUrlElement = document.getElementById("portalUrl");
    const copyButton = document.getElementById("copyPortalUrl");
    const emailButton = document.getElementById("emailLink");
    const whatsappButton = document.getElementById("whatsappLink");
    const DOMAIN_SUFFIX = ".cbtschool.ng";

    let registration = {};
    try {
        registration = typeof getRegistration === "function"
            ? getRegistration() || {}
            : JSON.parse(sessionStorage.getItem("flamaRegistration") || "{}");
    } catch (error) {
        console.error("Unable to read registration data:", error);
    }

    const school = registration.registeredSchool || {};
    const owner = registration.registeredOwner || {};
    const schoolName = school.name || school.schoolName || registration.school?.schoolName || "Your School";
    const schoolEmail = registration.ownerEmail || owner.email || "";
    const subdomain = String(school.subdomain || "").trim().toLowerCase();
    const portalUrl = registration.portalUrl || (subdomain ? `https://${subdomain}${DOMAIN_SUFFIX}` : "");

    if (schoolNameElement) schoolNameElement.textContent = schoolName;
    if (schoolEmailElement) schoolEmailElement.textContent = schoolEmail || "your registered email";
    if (portalUrlElement) portalUrlElement.textContent = portalUrl || "School portal URL unavailable";

    copyButton?.addEventListener("click", async () => {
        if (!portalUrl) {
            alert("The school portal URL could not be found.");
            return;
        }
        try {
            await navigator.clipboard.writeText(portalUrl);
            alert("School portal URL copied successfully!");
        } catch (error) {
            window.prompt("Copy your school portal URL:", portalUrl);
        }
    });

    emailButton?.addEventListener("click", () => {
        if (!portalUrl) return alert("The school portal URL is unavailable.");
        const subject = encodeURIComponent(`${schoolName} School Portal`);
        const body = encodeURIComponent(`Hello,\n\nVisit the ${schoolName} school portal using this link:\n${portalUrl}\n\n`);
        window.location.href = `mailto:${encodeURIComponent(schoolEmail)}?subject=${subject}&body=${body}`;
    });

    whatsappButton?.addEventListener("click", () => {
        if (!portalUrl) return alert("The school portal URL is unavailable.");
        const message = encodeURIComponent(`${schoolName} School Portal\n${portalUrl}`);
        window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
    });

    const dashboardLink = document.querySelector('a[href="../school-admin/index.html"]');
    if (dashboardLink && portalUrl) {
        dashboardLink.href = "../school-admin/index.html";
        dashboardLink.target = "_blank";
        dashboardLink.rel = "noopener noreferrer";
    }

    if (!portalUrl) console.warn("Activated portal URL is missing from registration storage.");
});
