const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();
const https = require("https");
/////////////////////////////




// ///////////////////////////
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://harshjha:sohansunita@cluster0.xc2usiv.mongodb.net/Dictiousers", { useNewUrlParser: true });
const wordschema = {
    word: { type: String },
    meaning: String
}

const userschema = {
    name: { type: String, required: true, unique: true },
    pin: Number,
    savedwords: [wordschema]

};
const users = mongoose.model("users", userschema);
const word = mongoose.model("word", wordschema);

// const word1=new word({
//     word:"anxiety",
//     meaning:"The state of being in mental stress "
// })


var wordarray = [];
const searchmap = new Map();
var username;

app.get("/", function (req, res) {
    // console.log("home route");
    res.render("signin", { note: "" });
})

app.post("/", function (req, res) {
    //    console.log("post from login page");
    let inputusername = req.body.name;
    let inputpin = req.body.pin;


    users.findOne({ name: inputusername }, function (err, result) {
        if (err) {
            console.log(err);
        }
        if (result) {
            // console.log(result);
            if (result.pin == inputpin) {
                username = inputusername;
                res.render("home", { name: inputusername });
            }
            else {
                res.render("signin", { note: "Password incorrect" });
            }
        }

        else {

            res.render("signin", { note: "No such username exists" });
        }

    })


    //    console.log(req.body.name);
    //    console.log(req.body.pin);
})

app.get("/signup", function (req, res) {
    // console.log("landed on signup page");
    res.render("signup", { note: "" });

})

app.post("/signup", function (req, res) {
    // console.log("post request from sign up page");
    let inputusername = req.body.name;

    if (req.body.pin1 == req.body.pin2) {
        users.findOne({ name: inputusername }, function (err, result) {
            if (err) {
                console.log(err);
            }
            if (result) {
                res.render("signup", { note: "already such username exists" });
            }
            else {
                const usernew = new users({
                    name: inputusername,
                    pin: (req.body.pin1),
                    savedwords: []
                })
                usernew.save();




                res.render("signin", { note: "Account Created successfully" });
            }

        })
    }
    else {
        res.render("signup", { note: "Please set and confirm your pin properly" });
    }

})

app.get("/home", function (req, res) {
    searchmap.clear();
    wordarray = [];
    res.render("home", { name: username });
})

app.post("/home", function (req, res) {
    let numberofwords = req.body.number;
    let namefromhome = req.body.name;
    //  console.log(numberofwords);
    if (numberofwords > 0) {
        res.render("search", { name: namefromhome, number: numberofwords });
    }



})



app.post("/search", async function (req, res) {
    // console.log(req.body);
    //https://api.dictionaryapi.dev/api/v2/entries/en/<word>
    const totalwords = req.body.number;

    //  const mysearchfunc=  (url)=>{

    //     https.get(url, function (response) {


    //             response.on("data", async function  (data) {
    //                 const searchresult = await  JSON.parse(data);

    //                 if (searchresult.title === "No Definitions Found") {
    //                     wordarray.push(word);
    //                     searchmap.set(word, "! No Definitions Found");

    //                 }

    //                 else {
    //                     var wordmeaning = searchresult[0].meanings[0].definitions[0].definition;

    //                     // searcharray.push({word,wordmeaning});
    //                     wordarray.push(word);
    //                     searchmap.set(word, wordmeaning);

    //                 }




    //             })





    //         })
    //     }



    const mysearchfunc = async (url,word) => {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = "";

                response.on("data", (chunk) => {
                    data += chunk;
                });

                response.on("end", async () => {
                    try {
                        const searchresult = JSON.parse(data);

                        if (searchresult.title === "No Definitions Found") {
                            wordarray.push(word);
                            searchmap.set(word, "! No Definitions Found");
                            // Do something if no definitions are found
                        } else {
                            const wordmeaning = searchresult[0].meanings[0].definitions[0].definition;
                            wordarray.push(word);
                            searchmap.set(word, wordmeaning);
                            // Do something with the word meaning
                        }
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        });
    };

    for (let i = 0; i < (totalwords); i++) {


        let word = req.body['word' + (i + 1)];
        //  wordarray.push(word);


        const url = ("https://api.dictionaryapi.dev/api/v2/entries/en/" + word);

        await mysearchfunc(url,word);




    }


    res.render("result", { name: (req.body.name), number: (totalwords), wordsarray: wordarray, wordsmap: searchmap });


})




app.post("/savedwordspage", function (req, res) {
    // console.log(req.body);
    users.findOne({ name: (req.body.name) }, function (err, foundlist) {
        if (err) {
            console.log(err);
        }
        else {
            res.render("mywords", { name: (req.body.name), wordsarray: (foundlist.savedwords) });
        }
    })

})


//https://api.dictionaryapi.dev/api/v2/entries/en/<word>
// app.get("/mywords",function(req,res){
//     console.log(req.body);

// })



app.post("/mywords", function (req, res) {
    // console.log("data saved to your account");
    // console.log(req.body);
    users.findOne({ name: (req.body.name) }, function (err, foundList) {
        foundList.savedwords.push({
            'word': req.body.word,
            'meaning': req.body.meaning
        });
        foundList.save();
        //after adding the value into the custom route ,redirect it to the respective route to render.

    })
    res.render("result", { name: (req.body.name), number: (req.body.number), wordsarray: wordarray, wordsmap: searchmap });

})



app.post("/deletefromsavedwords", function (req, res) {
    let tempname = req.body.name;


    users.findOneAndUpdate({ name: req.body.name }, { $pull: { savedwords: { word: (req.body.word) } } }, function (err, foundList) {
        //   console.log(foundList);
        // res.redirect("/home");

        users.findOne({ name: tempname }, function (err, foundlist) {
            res.render("mywords", { name: tempname, wordsarray: (foundlist.savedwords) });
        })


    })



})





app.listen(process.env.PORT || 4000, function () {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});