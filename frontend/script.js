function convertText() {
    const text = document.getElementById("textInput").value;
    const html = "<p>" + text.replace(/\n/g, "</p><p>") + "</p>";
    document.getElementById("htmlOutput").innerHTML = html;
}

async function uploadAudio() {
    const file = document.getElementById("audioInput").files[0];
    if (!file) return alert("Select an audio file first!");

    const formData = new FormData();
    formData.append("audio", file);

    const response = await fetch("/transcribe", {
        method: "POST",
        body: formData
    });
    const data = await response.json();
    document.getElementById("transcriptOutput").innerText = data.text;
}
