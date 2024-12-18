const serverLink = 'https://quantaapi-pw5v.onrender.com/';
let chat = null;
let user_id = null;
let is_user_verified = false;

alert("Hey there");
alert("Hey there second time!!");

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

document.addEventListener('DOMContentLoaded', async () => {
    window.$memberstackDom.getCurrentMember().then(response => {
        if(response){
            user_id = response.data.id
            is_user_verified = response.data.verified
        }
    })

    const data = await dataPromise
    if(!data) return

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
                <img src="${img_src}" class="sbmt-button" data-id="${id}" onclick="openChat(event)">
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


function openChat(ev){
    let id = ev.target.getAttribute("data-id");
    let problemName = id.replace(/_/g, ' ');
    if(!chat) {
        chatWindow = document.createElement("div");
        chatWindow.id = "chatWindow";
        chatWindow.innerHTML = `
        <span class="close-chat-btn" onclick="closeWindow(event)">✖</span>

    <div id="inputDiv" class="chat-screen">
        <h6 id="submitHeader">Submit your solution to ${problemName}:</h6>
        <textarea id="solution-input" onkeydown="handleKeydown(event)" placeholder="Submit your solution..."></textarea>
        <button id="submit-btn" class="btn" onclick="sendSolution(event)">Send</button>
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
    /*
        if(!is_user_verified){
            showError("Only registered, and verified users can send solutions. Login and verify your email to continue")
            return;
        }
      */
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
                    html += `
                    <div>
                        <h3 class="response-field">${key}:</h3>
                        <p class="response-field">${value}</p>
                    </div>
                    `
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
