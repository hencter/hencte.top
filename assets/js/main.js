// const root = document.body.parentElement;
// let media = window.matchMedia("(prefers-color-scheme:dark)")

// let colorMode = localStorage.getItem("color-mode")
// root.classList.toggle(colorMode, true)

// //监听样式切换
// let callback = (e) => {
//   let prefersDarkMode = e.matches;
//   console.log(prefersDarkMode);
//   if (prefersDarkMode) {
//     localStorage.setItem("color-mode", "dark")
//     root.classList.toggle("dark", true)

//   } else {
//     localStorage.setItem("color-mode", "light")
//     root.classList.toggle("light", true)
//   }
// };

// if (typeof media.addEventListener === "function") {
//   media.addEventListener("change", callback);
// } else if (typeof media.addEventListenertener === "function") {
//   media.addEventListenerer(callback);
// }
