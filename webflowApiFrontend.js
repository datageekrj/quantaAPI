const serverLink = 'https://quantaapi-pw5v.onrender.com/';
let chat = null;
let user_id = null;
let is_user_verified = false;
let overlay = document.createElement("div");



let ids = ["Catan_Special_Number","Expected_Num_Boxes_with_Coupons", "Test_Problem"];

const dataPromise = fetch(serverLink + "getProblems", {
    method: 'POST',
    body: JSON.stringify({ids: ids}),
    headers: {'Content-Type': 'application/json'},
}).then(response => {
    if (!response.ok) {
        console.error(`HTTPS error! status: ${response.status}`);
        return null
    }
    const questions = response.json();
    console.log("Here are loaded questions: ", questions);
    return questions
}).catch(error => {
    console.error(error);
})

const script1 = document.createElement("script");
script1.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js";
script1.async = true;
const script2 = document.createElement("script");
script2.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
script2.async = true;
const script3 = document.createElement("script");
script3.src = "https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js";
script3.async = true;
document.head.appendChild(script3);
document.head.appendChild(script2);
document.head.appendChild(script1);
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css";
document.head.appendChild(link);

document.addEventListener('DOMContentLoaded', async () => {
    window.$memberstackDom.getCurrentMember().then(response => {
        if(response){
            user_id = response.data.id
            is_user_verified = response.data.verified
        }
    })

    const data = await dataPromise
    if(!data) return

    overlay.id = "chatOverlay";
    document.body.appendChild(overlay);

    document.querySelectorAll('.insert-problem').forEach((el) =>{
        let id = el.innerText.replace(/\s+/g, '');
        if(!data[id]){
            el.innerHTML = `Failed to load element with id ${id}`
            return
        }

        let problemName =  id.replace(/_/g, ' ');
        let img_src = `https://cdn.prod.website-files.com/6568bfe66e016172daa08150/66ede06843f101bc518e0798_submit_icon.svg`
        el.innerHTML = `
                <p class="edu-problem-name-and-num">${problemName}</p>
                <p class="edu-p">${data[id]}</p>
                <div class = ".sbmt-button-container"><img src="${img_src}" class="sbmt-button" data-id="${id}" onclick="openChat(event)"></div>
                `
        try {
            MathJax.startup.promise.then(() => {
                MathJax.typeset([el])
            }).catch((err) => console.log('MathJax initialization failed:', err));
        }catch(e){
            console.error('MathJax initialization failed:', e);
        }
    })
})


window.updatePreview = function () {
    const input = document.getElementById("solution-input").value;
    const previewArea = document.getElementById("preview-area");

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
    previewArea.innerHTML = markdown;
};

window.clearPreviousInput = function() {
    const textArea = document.getElementById("solution-input");
    const previewArea = document.getElementById("preview-area");

    textArea.value = "";
    previewArea.innerHTML = "Your preview will appear here...";
}

function openChat(ev){
    let id = ev.target.getAttribute("data-id");
    let problemName = id.replace(/_/g, ' ');
    if(!chat) {
        overlay.style.display = "block";
        chatWindow = document.createElement("div");
        chatWindow.id = "chatWindow";
        chatWindow.innerHTML = `
        <span class="close-chat-btn" onclick="closeWindow(event)">x</span>

    <div id="inputDiv" class="chat-screen">
        <h6 id="submitHeader">Submit your solution to ${problemName}: </h6>
        <div class="split-view">
            <!-- Left Pane: Input Area -->
            <div class="left-pane">
                <textarea id="solution-input" oninput="updatePreview()" placeholder="Write your text or LaTeX here..."></textarea>
            </div>

			<div id = "divider"></div>

            <!-- Right Pane: Preview Area -->
            <div class="right-pane">
                <div id="preview-area">Your preview will appear here...</div>
            </div>
        </div>
		<div id = "submit-btn-container">
	        <button id="submit-btn" class="btn" onclick="sendSolution(event)">Send</button>
			
		</div>
    </div>

    <!-- Loading Screen -->
    <div id="loadingDiv" class="chat-screen">
        <p>Grading your submission...</p>
    </div>

    <!-- Result Screen -->
    <div id="responseDIV" class="chat-screen">
        <div id="responseBody">
        </div>
        <div id="feedback-buttons">
            <button id="thumb-up-btn" onclick="sendFeedback(event, true)" class="btn">👍</button>
            <button id="thumb-down-btn" onclick="sendFeedback(event, false)" class="btn">👎</button>
            <p id="thnk_feedback" style="display: none">Thank you for your feedback</p>
        </div>
    </div>

    <!-- Error Screen -->
    <div id="errorDiv" class="chat-screen">
        <p id="error-message"></p>
    </div>
    `;
        document.body.appendChild(chatWindow);

		const container = chatWindow.querySelector('.split-view');
		const left = chatWindow.querySelector('.left-pane');
		const divider = chatWindow.querySelector('#divider');
		const right = chatWindow.querySelector('.right-pane');

		let isDragging = false;

		divider.addEventListener('mousedown', (e) => {
			isDragging = true;
			document.body.style.cursor = 'col-resize'; // Change cursor during drag
		});

		document.addEventListener('mousemove', (e) => {
			if (!isDragging) return;
		
			// Calculate new widths based on mouse position
			const containerRect = container.getBoundingClientRect();
			const newLeftWidth = e.clientX - containerRect.left;
		
			// Set boundaries
			const minLeftWidth = 200; // Minimum width for the left pane
			const maxLeftWidth = containerRect.width - 200; // Minimum width for the right pane
		
			if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
				left.style.flex = `0 0 ${newLeftWidth}px`;
				right.style.flex = `1 1 ${containerRect.width - newLeftWidth - 5}px`; // Adjust right pane width
			}
		});

		document.addEventListener('mouseup', () => {
			isDragging = false;
			document.body.style.cursor = ''; // Reset cursor
		});
		
        chat = {
            window: chatWindow,
            input: chatWindow.querySelector("#solution-input"),
            loadingDiv: chatWindow.querySelector("#loadingDiv"),
            responseDIV: chatWindow.querySelector("#responseDIV"),
            responseBody: chatWindow.querySelector("#responseBody"),
            inputDiv: chatWindow.querySelector("#inputDiv"),
            submitHeader: chatWindow.querySelector("#submitHeader"),
            errorDiv: chatWindow.querySelector("#errorDiv"),
            errorP: chatWindow.querySelector("#error-message"),
            thnkFeedback: chatWindow.querySelector("#thnk_feedback"),
            problemID: id,
            status: "input"
        }
        showChatPage("inputDiv")
    }
    else{
        if(!is_user_verified){
            showError("Only registered, and verified users can send solutions. Login and verify your email to continue")
            return;
        }
	overlay.style.display = "block";
        clearPreviousInput();
        if(chat.status == "fetching") chat.controller.abort()
        chat.submitHeader.innerHTML = `Submit your solution to ${problemName}:`;
        showChatPage("inputDiv");
        chat.problemID = id;
        chat.status = "input";
    }
}


function closeWindow(ev){
    if(chat.status == "fetching") chat.controller.abort()
    chat.problemID = null;
    chat.window.style.display = "none";
    chat.status = "closed";
    clearPreviousInput();
    chat.window.style.display = "none";
    overlay.style.display = "none";
	chat.window.remove();
	chat = null;
}

function showChatPage(pageID){
    if(!chat){
        console.error("No chat found")
        return
    }

    chat.window.style.display = 'block';
    chat.window.querySelectorAll('.chat-screen').forEach(screen => {
        screen.style.display = 'none';
    });

    if(pageID == "inputDiv") {
        chat.thnkFeedback.style.display = 'none'
        for (let id of ['thumb-up-btn', 'thumb-down-btn']) {
            let el = document.getElementById(id)
            el.classList.remove("pressed");
            el.removeAttribute("disabled")
        }
    }

	if (pageID === "loadingDiv"){
	    // Step 1: Shrink the chat window
	    chat.window.style.transform = "none";
		chat.window.style.animation = 'none';
		chat.window.style.transition = 'all 0.5s ease'; // Add smooth transition for the changes
	    chat.window.style.width = 'auto'; // Adjust width as needed
	    chat.window.style.height = 'auto'; // Adjust height as needed
		chat.window.style.maxHeight = "100vh";
		chat.window.style.maxWidth = "600px";
		chat.window.style.bottom = "20px";
		chat.window.style.right = "20px";
		
		
	}
    chat.window.querySelector(`#${pageID}`).style.display = 'block';
}

function showError(msg){
    showChatPage("errorDiv");
    chat.errorP.innerHTML = msg;
}

function sendSolution(ev){
    const solution = chat.input.value.trim();
    if(!solution)
        return
    if(!chat.problemID){
        console.error('Something went wrong')
        return
    }
    chat.input.value = "";
    showChatPage("loadingDiv")
    chat.status = "fetching";
    chat.controller = new AbortController();
    fetch(serverLink + 'generateResponse', {
        method: 'POST',
        body: JSON.stringify({problem_id: chat.problemID, student_solution: solution, user_id: user_id}),
        headers: {'Content-Type': 'application/json'},
        signal: chat.controller.signal
    })
        .then(response => {
            chat.status = "checked";
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                chat.status = "error";
                if(response.status == 401){
                    showError("Only registered, and verfied users can send solutions. Login and verify your email to continue")
                }
                else {
                    showError("Ooops sometging went wrong:(");
                }

            }
            return response.json();
        })
        .then(data => {
                if(!data.response) return
                let html = ``
                for(let [key, value] of Object.entries(data.response)) {
                    key = key.replace(/_/g, ' ');

                    if (key.toLowerCase() === "overall grade"){
                        html += `
                        <div class="overall-grade-block">
								<div class="response-block overall-grade">
										<h3 class="response-title">${key}:</h3>
										<p class="response-value">${value}</p>
								</div>
						</div>
                        `
                    } else if (key.toLowerCase().includes("sanity")) {
                        html += `
                        <div class="response-block long">
								<h3 class="response-title">${key}:</h3>
								<p class="response-field">${value}</p>
						</div>
                        `
                    } else {
                        html += `
                        <div class="response-block">
								<h3 class="response-title">${key}:</h3>
								<p class="response-field">${value}</p>
						</div>
                        `
                    }
                }
                chat.responseBody.innerHTML = html;
                showChatPage("responseDIV");
                chat.responseID = data.submission_id;
                try{
                    MathJax.typeset([chat.responseDIV]);
                }catch(e){
                    console.error(e);
                }
            }
        )
        .catch(error => {
            if(chat.controller.signal.aborted) return
            chat.status = "error";
            showError("Ooops sometging went wrong:(");
            console.error('Error fetching data:', error)
        });
}

function sendFeedback(ev, liked){
    ev.target.classList.add("pressed")
    document.getElementById("thumb-up-btn").setAttribute("disabled", true)
    document.getElementById("thumb-down-btn").setAttribute("disabled", true)
    chat.thnkFeedback.style.display = 'block';
    fetch(serverLink + 'submitFeedback', {
        method: 'POST',
        body: JSON.stringify({memberstack_user_id: user_id, submission_id: chat.responseID, liked_by_user: liked}),
        headers: {'Content-Type': 'application/json'},
    })
        .then(response => {
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return response.json();
            }
            return response.json();
        })
        .then(data => {
                console.log(`Saved: ${data.saved}`);
            }
        )
        .catch(error => {
            console.error('Error fetching data:', error)
        });
}

function handleKeydown(event){
    if (event.key === 'Enter' && !event.shiftKey) {
        sendSolution();
    }
}
