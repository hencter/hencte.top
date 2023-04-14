
let root = document.body.parentElement
let light = "light"
let dark = "dark"

let darkMode = localStorage.getItem("color-scheme")

if (darkMode === "dark") enableDarkMode()

if (darkMode === "light") disableDarkMode()

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
  root.classList.remove("light")
  localStorage.setItem("color-scheme", "dark")
}

function disableDarkMode() {
  root.classList.remove("dark")
  root.classList.add("light")
  localStorage.setItem("color-scheme", light)
}

window
  .matchMedia(`(prefers-color-scheme: ${dark})`)
  .addEventListener("change", mediaQueryList => (mediaQueryList.matches ? enableDarkMode() : disableDarkMode()))
window
  .matchMedia(`(prefers-color-scheme: ${light})`)
  .addEventListener("change", mediaQueryList => (mediaQueryList.matches ? disableDarkMode() : enableDarkMode()))


// 参考：https://juejin.cn/post/6891623236145496071 实现
