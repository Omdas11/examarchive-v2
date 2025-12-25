// examarchive-v2/js/browse.js

fetch("data/papers.json")
  .then(response => response.json())
  .then(papers => {
    const list = document.getElementById("papers-list");

    if (!list) {
      console.error("papers-list element not found in browse.html");
      return;
    }

    if (papers.length === 0) {
      list.innerHTML = "<p>No papers available.</p>";
      return;
    }

    papers.forEach(paper => {
      const item = document.createElement("div");
      item.style.borderBottom = "1px solid #ccc";
      item.style.padding = "10px 0";

      item.innerHTML = `
        <strong>${paper.paper_code}</strong> – ${paper.paper_name}<br>
        <small>
          ${paper.programme} | Semester ${paper.semester} | ${paper.year}
        </small><br>
        <a href="papers/${paper.pdf}" target="_blank">📄 Open PDF</a>
      `;

      list.appendChild(item);
    });
  })
  .catch(error => {
    console.error("Failed to load papers.json:", error);
  });
