const ps = document.getElementById("ps");
const fn = document.getElementById("fn");
const email = document.getElementById("email");
const cps = document.getElementById("cps");
const myform1 = document.getElementById("form1");
const ermsg = document.getElementById("errorMsg");

ps.addEventListener("blur",function(event){
    if(event.target.value === ""){
        ermsg.textContent = "Password is empty"
    }
    else{
        ermsg.textContent = ""
    }
})

cps.addEventListener("blur",function(event){
    if(event.target.value === ""){
        ermsg.textContent = "Confirm Password is empty"
    }
    else{
        ermsg.textContent = ""
    }
})


fn.addEventListener("blur",function(event){
    if(event.target.value === ""){
        ermsg.textContent = "Name is empty"
    }
    else{
        ermsg.textContent = ""
    }
})


email.addEventListener("blur",function(event){
    if(event.target.value === ""){
        ermsg.textContent = "Email is empty"
    }
    else{
        ermsg.textContent = ""
    }
})

