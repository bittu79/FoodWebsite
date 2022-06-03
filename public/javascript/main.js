const ps1 = document.getElementById("ps");
const email1 = document.getElementById("email");
const ermsg = document.getElementById("errorMsg");

email1.addEventListener("blur",function(event){
    if(event.target.value === ""){
        ermsg.textContent = "Email is empty"
    }
    else{
        ermsg.textContent = ""

    }
})

ps1.addEventListener("blur",function(event){
    if(event.target.value === ""){
        ermsg.textContent = "Password is empty"
    }
    else{
        ermsg.textContent = ""
    }

})

