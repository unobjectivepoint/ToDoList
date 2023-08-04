//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://admin-agata:Test1234@cluster0.goaewje.mongodb.net/todolistDB');
const bodyParser = require("body-parser");
const _ = require("lodash");
const date = require(__dirname + "/date.js");
const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/images', express.static('images'));

const today = date.getDate();

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

const item1 = new Item({ name: "Go for a walk" });
const item2 = new Item({ name: "Finish ToDoList App" });
const item3 = new Item({ name: "Walk the dog" });

const defaultItems = [item1, item2, item3];

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({ name: itemName });

  if (listName === "today") {
    await newItem.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(newItem);
    console.log("FoundList is: " + foundList);
    await foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkboxItemID = req.body.checkbox;
  const listName = req.body.listName;
  console.log("List name from hidden input: " + listName);
  if (listName === "today") {
    await Item.findByIdAndRemove(checkboxItemID);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkboxItemID } } });
    res.redirect("/" + listName);
  }
});

app.get("/", async function (req, res) {

  const foundItems = await Item.find({});
  const customLists = await List.find({});

  if (foundItems.length === 0) {
    Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: foundItems, customLists: customLists, date: today });
  }
});

app.get("/:customListName", async function (req, res) {
  const customLists = await List.find({});
  const customListName = _.capitalize(req.params.customListName);
  const checkList = await List.findOne({ name: customListName });

  if (!checkList) {
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    await list.save();
    console.log("Its in if: " + list);
    res.render("list", { listTitle: customListName, newListItems: defaultItems, customLists: customLists, date: today });
  } else {
    res.render("list", { listTitle: customListName, newListItems: checkList.items, customLists: customLists, date: today });
    console.log("Its in else: " + checkList.items);
  }
});

app.post("/add-list", async function (req, res) {
  const newList = new List({ name: req.body.newList });
  const allLists = await List.find({});
  const listsNames = allLists.forEach((list) => {
    return list.name;
  });
  console.log("this is array of lists names: " + listsNames);
  res.redirect("/" + newList.name);
});

app.post("/:customListName", async function (req, res) {
  const newItem = new Item({ name: req.body.newItem });
  const listName = req.body.listName;
  await newItem.save();
  res.redirect("/" + listName);
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});