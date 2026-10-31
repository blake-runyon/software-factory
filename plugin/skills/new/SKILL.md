---
name: new
description: "Software Factory: create a new project from the factory starter repo."
argument-hint: "<project-name> [parent-dir]"
disable-model-invocation: true
---
Create a new Software Factory project. Arguments: $ARGUMENTS

1. The first argument is the project name (lowercase letters, digits, dashes). The optional
   second is the parent directory; if it is missing, use the current working directory.
   If no name was given, ask for one.
2. Run the `new-project.sh` script that sits in this skill's base directory:
   `bash "<this skill's base directory>/new-project.sh" <name> <parent-dir>`
3. Report the script's output. Do not run `npm run setup` unless the human asks; suggest:
   `cd <path> && npm run setup && npm run verify`, then start Claude there and run
   `/factory:spec <idea>`.
