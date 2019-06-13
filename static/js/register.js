var im = Immuto.init(true, "https://dev.immuto.io") // https://dev.immuto.io for dev env

function register() {
    $("#register-button").attr("disabled", true)

    let email = $("#email-input").val()
    let password = $("#password-input").val()
    let repeat_password = $("#repeat-password-input").val()

    if (!email) {
        alert("Error: Email required.")
        $("#register-button").attr("disabled", false)
        return
    }

    if (!password) {
        alert("Error: Password required.")
        $("#register-button").attr("disabled", false)

        return
    }

    if (!repeat_password) {
        alert("Error: Repeated password required.")
        $("#register-button").attr("disabled", false)
        return
    }

    if (password !== repeat_password) {
        alert("Error: Passwords must match.")
        $("#register-button").attr("disabled", false)
        return
    }

    register_user(email, password).then((result) => {
        alert("Registration successful. You may now login!")
        window.location.href = "/login"
    }).catch((err) => {
        $("#register-button").attr("disabled", false)   
        alert("Error during registration: " + err)
    })
}

function register_user(email, password) {
    return new Promise((resolve, reject) => {
        generate_registration_token(email).then((orgToken) => {
            im.register_user(email, password, orgToken).then(() => {
                resolve()
            }).catch((err) => {
                reject(err)
            })
        }).catch((err) =>{
            reject(err)
        })
    })
}

function generate_registration_token(email) {
    return new Promise((resolve, reject) => {
        var http = new XMLHttpRequest()
        let sendstring = "email=" + email.toLowerCase()
        http.open("POST", "/register-org-user", true)
        http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
        http.onreadystatechange = () => {
            if (http.readyState == 4 && http.status == 200) {
                let regToken = http.responseText
                resolve(regToken)
            } else if (http.readyState == 4) {
                reject(http.responseText)
            }
        }
        http.send(sendstring)
    })
}