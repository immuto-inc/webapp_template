var im = Immuto.init(true, "https://dev.immuto.io") // https://dev.immuto.io for dev env

function login () {
    if (im.authToken) {
        im.deauthenticate()
    }

    $("#login-button").attr("disabled", true)


    let email = $("#email-input").val()
    let password = $("#password-input").val()

    if (!email) {
        alert("Error: Email required.")
        $("#login-button").attr("disabled", false)

        return
    }

    if (!password) {
        alert("Error: Password required.")
        $("#login-button").attr("disabled", false)

        return
    }

    im.authenticate(email, password).then((authToken) => {
        create_user_session(authToken).then(() => {
            window.location.href = "/dashboard"
        }).catch((err) => {
            alert(err)
        })
    }).catch((err) => {
        $("#login-button").attr("disabled", false)

        alert("Unable to login: \n" + err)
    })
}


function create_user_session(authToken) {
    return new Promise((resolve, reject) => {
        var http = new XMLHttpRequest()
        let sendstring = "authToken=" + authToken
        http.open("POST", "/login-user", true)
        http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
        http.onreadystatechange = () => {
            if (http.readyState == 4 && http.status == 204) {
                resolve()
            } else if (http.readyState == 4) {
                reject(http.responseText)
            }
        }
        http.send(sendstring)
    })
}