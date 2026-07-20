const menu = document.querySelector(".menu-btn");
const nav = document.querySelector(".nav-links");
const uploadBtn = document.getElementById("uploadBtn");
const resumeInput = document.getElementById("resumeInput");

menu.onclick = () => {
    nav.classList.toggle("active");
};

uploadBtn.addEventListener("click", () => {
    resumeInput.click();
});

resumeInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    console.log("Selected:", file.name);

    const originalBtnHTML = uploadBtn.innerHTML;
    uploadBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Analyzing...`;
    uploadBtn.style.opacity = "0.8";
    uploadBtn.style.pointerEvents = "none";

    const formData = new FormData();
    formData.append("resume", file);

    try {
        const response = await fetch("https://resume-analyser-x75a.onrender.com/analyze", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || `Status Code ${response.status}`);
        }

        console.log("Success Data:", data);
        
        sessionStorage.setItem("resumeAnalysisData", JSON.stringify(data.result));

        console.log("Success Data:", data);

alert("Redirecting now");

window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Full Frontend Error Log:", error);
        alert(`Upload failed: ${error.message}`);
        
        // Revert button state if things fail
        uploadBtn.innerHTML = originalBtnHTML;
        uploadBtn.style.opacity = "1";
        uploadBtn.style.pointerEvents = "auto";
    }
});
