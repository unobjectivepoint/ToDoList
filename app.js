//jshint esversion:6

import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import _ from "lodash";
import { getDate } from "./date.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/images', express.static('images'));

const password = process.env.DBCLUSTER;
mongoose.connect('mongodb+srv://admin-agata:' + password + '@cluster0.goaewje.mongodb.net/todolistDB');
const today = getDate();

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    unique: true
  },
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

const item1 = new Item({ name: "Be kind" });
const item2 = new Item({ name: "Get the work done" });
const item3 = new Item({ name: "Go for a walk"});

const defaultItems = [item1, item2, item3];

app.get("/", async (req, res) => {
  const foundItems = await Item.find({});
  const customLists = await List.find({});
  try {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems, customLists: customLists, date: today });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/:customListName", async (req, res) => {
  const listName = _.capitalize(req.params.customListName);
  try {
    let customLists = await List.find({});
    const checkList = await List.findOne({ name: listName });

    if (listName === "About" && !checkList) {
      res.render("about");
    } else if (listName === "Today") {
      res.redirect("/");
    } else if (checkList) {
      res.render("list", { listTitle: checkList.name, newListItems: checkList.items, customLists: customLists, date: today });
    } else if (!checkList) {
      const list = new List({
        name: listName,
        items: defaultItems
      });
      await list.save();
      customLists = await List.find({});
      res.render("list", { listTitle: listName, newListItems: defaultItems, customLists: customLists, date: today });
    } 
  } catch (error) {
    console.log(error);
  }
});

app.post("/add-list", (req, res) => {
  const newListName = _.capitalize(req.body.newList).trim();
  if (newListName === "Today") {
    res.redirect("/");
  } else {
    res.redirect("/" + newListName);
  }
});

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  if (itemName.trim() !== '') {
    const item = new Item({
      name: itemName,
    });

    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      List.findOne({ name: listName })
        .then((foundItems) => {
          foundItems.items.push(item);
          foundItems.save();
          res.redirect("/" + listName);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } else {
    if (listName === "Today") {
      res.redirect("/");
    } else {
      List.findOne({ name: listName })
        .then((foundItems) => {
          res.redirect("/" + listName);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
});

app.post("/delete", async (req, res) => {
  const checkboxItemID = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    await Item.findByIdAndRemove(checkboxItemID);
    console.log("Entro nel if");
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkboxItemID } } });
    console.log("Entro nel else");
    res.redirect("/" + listName);
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});