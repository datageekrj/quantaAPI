const script2 = document.createElement("script");
script2.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
script2.async = true;
const script3 = document.createElement("script");
script3.src = "https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js";
script3.async = true;
document.head.appendChild(script3);
document.head.appendChild(script2);
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css";
document.head.appendChild(link);


let serverLink = 'https://quantaapi-pw5v.onrender.com/';
let popup = null;
let popupDiv = null;
let submissions = {};
let user_id = null;



document.addEventListener('DOMContentLoaded', async () => {
    let response = await window.$memberstackDom.getCurrentMember()

    if (!response) {
        return
    }
    user_id = response.data.id

    window.addEventListener('click', function(event) {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    });

    fetch(serverLink + 'getUserSubmissions', {
        method: 'POST',
        body: JSON.stringify({
                user_id: user_id,
            }
        ),
        headers: {'Content-Type': 'application/json'},
    }).then(response => {
        if (!response.ok) {
            console.error(`HTTPS error! status: ${response.status}`);
            return null
        }
        return response.json();
    }).then(data =>{
        
        console.log("Here is the full data: ", data);
        let div  = document.querySelector("#delta_user_results");
        div.innerHTML = `
                <table class="submissions-table">
                        <thead>
                        <tr>
                            <th>Problem ID</th>
                            <th>Grades</th>
                        </tr>
                        </thead>
                        <tbody id="t-body">
                        </tbody>
                    </table>
        `
        let body = div.querySelector('#t-body');

        let body_html = ``
        for(let [id, results] of Object.entries(data)) {
            console.log("Object wise:  ", id, results);
            let row_html = ``
            for(let result of results) {
                row_html += `<a onclick="showSubmission(event)" data-id="${result.id}">${result.overall_grade}</a>`
            }
	    if (ids.includes(id)){
		let problemName = id.replace(/_/g, ' ');
            body_html += `
                        <tr>
                            <td>${problemName}</td>
                            <td>
                                <div class="grades-list">
                                    ${row_html}
                                </div>
                            </td>
                        </tr>
            `;
	    }   
        }
        body.innerHTML = body_html;


    }).catch(error => {
        console.error(error);
    })
})

function showSubmission(event){
    event.preventDefault();
    if(popup){
        popupDiv.innerHTML = ` <p>Downloading your details, please wait</p>`
    }
    else{
        popup = document.createElement("div");
        popup.classList.add('popup')
        popup.innerHTML = `
            <div class="popup-content">
                    <span class="close-btn" onclick="closePopup()">&times;</span>
                    <div id="popup-body">
                            <p style = "margin: 10px">Downloading your details, please wait</p>
                    </div>
                </div>
            `
        document.body.append(popup)
        popupDiv = popup.querySelector("#popup-body")
    }
    popup.style.display = 'flex';

    const id = event.target.getAttribute('data-id');
    if(submissions[id]){
        renderDetails(submissions[id])
    }
    else{
        fetch(serverLink + 'getSubmission', {
            method: 'POST',
            body: JSON.stringify({
                    user_id: user_id,
                    submission_id: id,
                }
            ),
            headers: {'Content-Type': 'application/json'},
        }).then(response => {
            if (!response.ok) {
                console.error(`HTTPS error! status: ${response.status}`);
                return null
            }
            return response.json();
        }).then(data =>{
            if(!data) return
            submissions[id] = data
            renderDetails(data)
        }).catch(error => {
            console.error(error);
        })
    }
}

function closePopup(event){
    popup.style.display = 'none'
}

function renderMarkdown(input){
    let markdown = marked.parse(input);
    markdown = markdown.replace(/\$\$(.+?)\$\$/g, (match, latex) => {
                try {
                    return katex.renderToString(latex, { displayMode: true, throwOnError: false });
                } catch (error) {
                    return `<span style="color: red;">${error.message}</span>`;
                }
   });
  markdown = markdown.replace(/\$(.+?)\$/g, (match, latex) => {
                try {
                    return katex.renderToString(latex, { displayMode: false, throwOnError: false });
                } catch (error) {
                    return `<span style="color: red;">${error.message}</span>`;
                }
   });
   return markdown;
}

function renderDetails(data){
    if(!popup){
        console.error("something went wrong");
        return
    }
	let html = "";
	// Ensure "Overall Grade" is handled first
	if (data.all_response["Overall_Grade"]) {
	    let key = "Overall Grade";
	    let value = data.all_response["Overall_Grade"];
	    html += `
	        <div class="overall-grade-block">
	            <div class="response-block overall-grade">
	                <h3 class="response-title">${key}:</h3>
	                <p class="response-value">${value}</p>
	            </div>
	        </div>
	    `;
	}

	// Iterate through other entries
	for (let [key, value] of Object.entries(data.all_response)) {
	    key = key.replace(/_/g, ' ');
	
	    // Skip "Overall Grade" as it was already handled
	    if (key.toLowerCase() === "overall grade") continue;
	
	    if (value.length > 30) {
	        html += `
	            <div class="response-block long">
	                <h3 class="response-title">${key}:</h3>
	                <p class="response-field">${value}</p>
	            </div>
	        `;
	    } else if (!key.toLowerCase().includes("input")) {
	        html += `
	            <div class="response-block">
	                <h3 class="response-title">${key}:</h3>
	                <p class="response-field">${value}</p>
	            </div>
	        `;
	    }
	}
	
	// Add user input block
	html += "<br>";
	html += "<hr>";

	if (data.user_input.length > 30){
		html += `
	    <div class="response-block long">
	        <h3 class="response-field">Your input:</h3>
	        <br>
	        <p class="response-field">${renderMarkdown(data.user_input)}</p>
	    </div>
	`;
	} else{
		html += `
	    <div class="response-block">
	        <h3 class="response-field">Your input:</h3>
	        <br>
	        <p class="response-field">${renderMarkdown(data.user_input)}</p>
	    </div>
	`;
	}
	
	
      popupDiv.innerHTML = html;
}
