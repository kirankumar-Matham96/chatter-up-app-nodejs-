// connecting to socket
const socket = io.connect("http://localhost:3000/");

// elements
const welcomeMessageEl = document.querySelector("#welcome-message");
const messageContainerEl = document.querySelector(".messages-container");
const formEl = document.querySelector("#chat-form");
const inputEl = document.querySelector("#input");
const connectedUsersContainerEl = document.querySelector(".users-list");

// variables
let userName = "";
let message = "";

/**
 * To set the time since message sent
 * @param {Date Object} date
 * @returns time since message sent
 */
const getTimeSinceMessage = (date) => {
  const lapseTimeInMilSec = Date.now() - date.valueOf();
  let seconds = (lapseTimeInMilSec / 1000).toFixed(0);
  let minutes = Math.floor(seconds / 60);
  let hours = "";
  if (minutes > 59) {
    hours = Math.floor(minutes / 60);
    hours = hours >= 10 ? hours : "0" + hours;
    minutes = minutes - hours * 60;
    minutes = minutes >= 10 ? minutes : "0" + minutes;
  }

  seconds = Math.floor(seconds % 60);
  seconds = seconds >= 10 ? seconds : "0" + seconds;
  if (hours != "") {
    return hours + ":" + minutes + ":" + seconds;
  }
  return minutes + ":" + seconds;
};

/**
 * To create message threads dynamically
 * @param {message data from the server} messageData
 */
const createMessageThread = (messageData) => {
  // create element
  const messageEl = document.createElement("li");
  const profileEl = document.createElement("img");
  const messageDataEl = document.createElement("div");
  const messageHeaderEl = document.createElement("div");
  const userNameEl = document.createElement("span");
  const timeEl = document.createElement("span");
  const messageContentEl = document.createElement("p");

  // update data
  profileEl.src = `${messageData.profilePicUrl}`;
  profileEl.alt = `${messageData.userName}`;
  profileEl.classList.add("profile-icon");

  userNameEl.textContent = `${messageData.userName}`;
  userNameEl.classList.add("user-name");

  const date = new Date(messageData.timestamp);
  const lapseTime = getTimeSinceMessage(date);
  timeEl.textContent = lapseTime;
  timeEl.classList.add("time");

  messageHeaderEl.appendChild(userNameEl);
  messageHeaderEl.appendChild(timeEl);
  messageHeaderEl.classList.add("message-thread-header");

  messageContentEl.textContent = messageData.message;
  messageContentEl.classList.add("message-content");

  messageDataEl.appendChild(messageHeaderEl);
  messageDataEl.appendChild(messageContentEl);
  messageDataEl.classList.add("message-data-container");

  messageEl.appendChild(profileEl);
  messageEl.appendChild(messageDataEl);

  // keep user messages to the right by userName condition
  if (userName === messageData.userName) {
    messageDataEl.classList.add("self-message-data-container");
    profileEl.classList.add("icon-margin-left");
    messageEl.classList.add("self-message");
  } else {
    profileEl.classList.add("icon-margin-right");
    messageEl.classList.add("message-thread");
  }

  messageContainerEl.appendChild(messageEl);
};

/**
 * To create a single user in the connected users list
 * @param {user name} user
 */
const createConnectedUser = (user) => {
  const userEl = document.createElement("li");
  userEl.innerHTML = `<div class="indicator"></div>${user}`;
  connectedUsersContainerEl.appendChild(userEl);
};

/**
 * To create the list of connected user
 * @param {users list from the server} users
 */
const createConnectedUsersList = (users) => {
  // clear the list before adding
  connectedUsersContainerEl.innerHTML = `<li id='users-list-header'>Connected Users ${users.length}</li>`;
  // creating users list
  users.forEach((user) => {
    if (user !== userName) {
      createConnectedUser(user);
    } else {
      createConnectedUser("You");
    }
  });
};

/**
 * To prevent anonymous users to join.
 *  - It will ask for the user name until user enters some text in the prompt.
 */
const askUserName = () => {
  userName = prompt("Please enter your name!").trim();
  while (!userName) {
    userName = prompt("Please enter your name!").trim();
  }
  console.log({ userName });
};
// on document load
document.addEventListener("DOMContentLoaded", () => {
  // taking user name
  askUserName();
  // emitting user join event
  if (userName) {
    socket.emit("join", userName);
  }

  // listening for the welcome event
  socket.on("welcome", (data) => {
    const { message, chatHistory } = data;

    //  append message to element
    welcomeMessageEl.innerHTML =
      "<div class='indicator'></div> <h3>" +
      message +
      "</h3><span class='type-indicator'></span>";

    // append chat history to the chat container
    chatHistory.map((message) => {
      createMessageThread(message);
    });
  });

  // for the typing message indicator
  inputEl.addEventListener("input", (e) => {
    socket.emit("typing", userName);
  });
});

// on message
formEl.addEventListener("submit", (event) => {
  event.preventDefault();

  // set message
  if (inputEl.value) {
    message = inputEl.value;
  }

  // emit messageSend event
  socket.emit("messageSend", { userName, message });

  // clearing the input
  inputEl.value = "";
});

// on receiving message
socket.on("message", (messageData) => {
  document.querySelector(".type-indicator").textContent = ``;
  createMessageThread(messageData);
});

// on joining of the new member
socket.on("newMember", ({ newUser, connectedUsers }) => {
  // updating the connected users list
  createConnectedUsersList(connectedUsers);

  // if the user joined is the same user (same client)
  if (newUser === userName) {
    return;
  }

  // notifying the other users
  const notifyEl = document.createElement("div");
  notifyEl.style.display = "flex";
  notifyEl.style.justifyContent = "center";
  const notifyMessageEl = document.createElement("p");
  notifyMessageEl.textContent = `${newUser} has joined`;
  notifyMessageEl.classList.add("notify");
  notifyEl.appendChild(notifyMessageEl);
  messageContainerEl.appendChild(notifyEl);
});

// to indicate the users of message incoming
socket.on("user-typing", (user) => {
  if (user !== userName) {
    document.querySelector(
      ".type-indicator"
    ).innerHTML = `<strong>${user}</strong> is typing...`;
  }
});

// on user left
socket.on("userLeft", ({ user, connectedUsers }) => {
  // update connected users list
  createConnectedUsersList(connectedUsers);

  if (user === userName) {
    return;
  }
  const notifyEl = document.createElement("div");
  notifyEl.style.display = "flex";
  notifyEl.style.justifyContent = "center";
  const notifyMessageEl = document.createElement("p");
  notifyMessageEl.textContent = `${user} has left`;
  notifyMessageEl.classList.add("notify");
  notifyEl.appendChild(notifyMessageEl);
  messageContainerEl.appendChild(notifyEl);
});
