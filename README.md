# Overview
NeuVector Security Center Admin Console.

# Requirements
This project is based on Scala 2.10 and managed by sbt, please follow [this](http://www.scala-sbt.org/release/tutorial/Setup.html) to setup sbt on your platform.

Follwing are the major libraries we used:

  * Spray 1.3.1
  * Akka 2.3
  * Angular Js
  * Bootstrap
  
# Quickstart
If you are using Intellij, just import the sbt project, to use Eclipse you need generate Eclipse project first, just run sbt eclipse, it will genertae the project for you.

For Intellij, in case import sbt not working, in sbt run gen-idea, it will create Intellij project for you, load the project afterwards.

For command line, just go to the project root, run sbt, go to project admin.

To start web server, on sbt prompt type "~ re-start" without double quotes, this will start web
server in hot deploy mode, means your changes (html, css even scala/java classes) will be auto
reloaded without restarting web server.

If you prefer simple mode on sbt prompt just type "run" without double quotes.

To browse the web UI: https://localhost:8443


# Coding standard
### Naming Convention

We mostly follow Java's and Scala's standard naming conventions.

### Line Length

- Limit lines to 100 characters.
- The only exceptions are import statements and URLs (although even for those, try to keep them under 100 chars).

### Spacing and Indentation

- Use 2-space indentation in general.
  ```scala
  if (true) {
    println("Wow!")
  }
  ```

- For classes whose header doesn't fit in a single line, put the extend on the next line with 2 space indent, and add a blank line after class header.
  ```scala
  class Foo(val param1: String, val param2: String,
            val param3: Array[Byte])
    extends FooInterface  // 2 space here
    with Logging {

    def firstMethod(): Unit = { ... }  // blank line above
  }
  ```

### Infix Methods

__Do NOT use infix notation__ for methods that aren't symbolic methods (i.e. operator overloading).
```scala
// Correct
list.map(func)
string.contains("foo")

// Wrong
list map (func)
string contains "foo"

// But overloaded operators should be invoked in infix style
arrayBuffer += elem
```

### Make special build of manager container

Build locally

```
make jar
make manager_image
```

An image called 'neuvector/manager' will be created locally. Give it a special tag and push to the local registry.

```
docker tag neuvector/manager 10.1.127.3:5000/neuvector/manager:gary
docker push 10.1.127.3:5000/neuvector/manager:gary
```
