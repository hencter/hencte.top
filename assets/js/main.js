
let root = document.body.parentElement

let darkMode = localStorage.getItem("color-scheme")

if (darkMode === "dark") enableDarkMode()

document.querySelector("#toggle").addEventListener("click", e => {
  darkMode = localStorage.getItem("color-scheme")
  if (darkMode === "dark") {
    disableDarkMode()
  } else {
    enableDarkMode()
  }
})

function enableDarkMode() {
  root.classList.add("dark")
  localStorage.setItem("color-scheme", "dark")
}

function disableDarkMode() {
  root.classList.remove("dark")
  localStorage.setItem("color-scheme", "light")
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", mediaQueryList => (mediaQueryList.matches ? enableDarkMode() : disableDarkMode()))


// 参考：https://juejin.cn/post/6891623236145496071 实现
