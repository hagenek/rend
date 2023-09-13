import "../index.css";
import "./login.css";

main();

async function main() {
  const form = document.querySelector("form") as HTMLFormElement;
  const username = document.getElementById("username") as HTMLInputElement;
  const password = document.getElementById("password") as HTMLInputElement;
  const button = form.querySelector("button") as HTMLButtonElement;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const loading = button.getAttribute("disabled");

    if (loading || !username.value || !password.value) {
      return;
    }

    button.setAttribute("disabled", 'true');

    const res: { token: string } = await fetch("https://data.novorender.com/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `username=${username.value}&password=${password.value}`,
    })
      .then((res) => res.json())
      .catch(() => {
        // Handle however you like
        return { token: "" };
      });

    if (res.token) {
        localStorage.setItem('access_token', res.token);
        location.replace('/');
    }

    button.removeAttribute("disabled");
  });
}
