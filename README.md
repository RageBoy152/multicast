# MultiCast - [Download](https://github.com/RageBoy152/multicast/releases/latest)

MultiCast V2.0 is currnetly work in progress.
For now, you can use the [web version of MultiCast](https://multicast.watch) until the application version is ready.

# How to Use

### The basics
The home page is split into 2 sections - "Feeds", "Outputs"

When you add a feed, using the "+" button on the top of the feed list, it gets added to the feed list.
You can then drag and drop it into an output feed.

The output area has 3 outputs - A, B & C.
Each output can have between 1 and 9 seperate feeds at once.


### App exclusive features

Due to the lack of browser security restrictions, the Multicast app comes with additional features for a better user experience such as volume sliders on feed outputs aswell as audio level vizualisers.


### Context Menu
Each feed has a context menu (three dots) you can click, you can also right click to open this menu.
In the context menu is buttons to edit, delete and copy credits. Credits will be copied in the format:
[ Credit: [Feed name]\(<link_to_youtube_stream>) ]


### Config editing
You're configuration data is saved in the browsers local storage. You can view this data using the settings icon on the navigation bar.
You can copy and paste other peoples configs but only manually edit values if you know what you're doing. There is very minimal input validation here.

<!-- ### For developers
If you wish to host this project locally, use `npm i` to install all the dependancies, then run `npm run dev` to open the dev version and `npm run build` to build which you can view by using `npx serve dist`. -->

# Technologies Used
- [React JS](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Electron JS](https://www.electronjs.org)


# License

This project is licensed under the Apache 2.0 License. More details can be found in the [LICENSE](https://github.com/RageBoy152/multicast/blob/main/LICENSE).
