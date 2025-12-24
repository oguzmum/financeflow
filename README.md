## About This Project

This project was built with ChatGPT Codex.

I started with only a vague idea of what I wanted to build.
The main inspiration was an Excel spreadsheet I had been using for financial planning.
In Excel, I constantly had to manually adjust the timeframes and more, which quickly became impractical and error prone.

Because of that, many of my prompts to Codex were not always perfectly precise.
Still, I think the final result turned out quite well.

I will go through the code and calculations manually to verify that everything is correct.
I may add additional features in the future, but for now the project fulfills my main use case.

---

## Challenges When Using ChatGPT Codex

While working with Codex, I encountered a few issues:

* I wanted the UI to be English only. I mentioned this in my initial prompt, but not consistently afterward. As a result, Codex sometimes used German UI text, while variable names were always in English.
* After receiving a solution, it wasn't possible to discuss or reason about it directly. Codex tends to immediately modify code instead of explaining decisions (which is probably just how Codex is designed :D). Whenever I wanted deeper understanding, I had to copy the patch into regular ChatGPT and discuss it there.
* Occasionally, Codex introduced different CSS styles for similar UI elements, which I then had to fix manually.
* Although I explicitly asked Codex not to modify files inside the `alembic` folder, it sometimes did. This wasn’t harmful, but unnecessary.

---

## Overall Impression

Despite these issues, I liked working with Codex.

Since I don’t have much experience with frontend development (and only limited backend experience with Python), Codex significantly lowered the barrier and made the entire process much easier and more approachable.

That said, I believe that fully relying on AI can be dangerous if the goal is deep understanding of a tech stack, framework, or programming language.
There are parts of the code (quite a few, to be honest) that I don’t fully understand yet, and it would take additional time to properly study them.

However, because I have a background in software/computer engineering, I was able to quickly understand the overall concepts, how the system works, and many parts of the code.

Overall, I think AI is a great companion in software development, but we should be careful not to rely on it blindly or “vibe-code” everything without understanding what’s happening.

---

I recently learned about the possibility of using an **`AGENTS.md`** file to define formatting rules, coding style, and architectural preferences.

In hindsight, some of the problems I encountered might not have happened if I had used one from the beginning
