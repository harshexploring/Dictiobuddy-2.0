const a=document.getElementById("accountbtn");
console.log(a);
const b=document.getElementById("dropdown");
console.log(b.style);
let flag=0;

a.addEventListener("click",function(){
  
if(flag==0){
    b.style.display="flex";
    flag=1;
} 
else{
    b.style.display="none";
    flag=0;
}


})
