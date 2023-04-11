const root = document.body.parentElement;
let media = window.matchMedia("(prefers-color-scheme:dark)");

// let currentColorMode = localStorage.getItem("color-mode")
// console.log(currentColorMode);
// if (currentColorMode=="dark") {
//   root.classList.toggle("dark", true);
// }

//监听样式切换
let callback = (e) => {
  let prefersDarkMode = e.matches;
  console.log(prefersDarkMode);
  root.classList.toggle("dark", prefersDarkMode);
  // if (prefersDarkMode) {
  //   localStorage.setItem("color-mode", "dark");
  // } else {
  //   localStorage.setItem("color-mode", "");
  // }
};

if (typeof media.addEventListener === "function") {
  media.addEventListener("change", callback);
} else if (typeof media.addEventListenertener === "function") {
  media.addEventListenerer(callback);
}
