class Game {
  constructor(data) {
    this.onHandlers = {
      url: {
        fn: null
      }
    }
    this.stop = false
    this.weight = data.weight
    this.permission = data.permission
    this.body = document.querySelector(data.body)
    this.body.style.width = this.weight + "px"
    if (this.weight < window.outerWidth) {
      this.body.style.height = this.weight + "px"
    } else {
      this.body.style.height = window.outerWidth / this.permission * 4 + "px"
    }
    this.body.style.position = "relative"

    this.squares = []
    this.render()
    this.generate("random")

    this.body.addEventListener("touchstart", (event) => {
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
    }, { passive: true })
    this.body.addEventListener("touchend", (event) => {
      this.handleTouchEnd(this.startX, this.startY, event)
    }, { passive: true })

  }

  render() {
    let loading = document.createElement("div")
    loading.classList.add("loading")
    this.loading = loading
    this.body.appendChild(loading)

    let field = document.createElement("div");
    field.classList.add("field");
    this.field = field
    this.body.appendChild(field);

    let win = document.createElement("div");
    win.classList.add("winner");
    win.textContent = "You win!"
    this.win = win
    this.body.appendChild(win);

    let close = document.createElement("span");
    close.classList.add("close");
    close.textContent = "X"
    close.addEventListener("click", () => {
      win.classList.remove("active")
      this.generate("random")
    })
    this.close = close
    win.appendChild(close);

    let x = 0
    let y = 0
    for (let i = 0; i < (this.permission ** 2) - 1; i++) {
      let square = document.createElement("div")

      if (this.weight < window.outerWidth) {
        square.style.width = this.weight / this.permission + "px"
        square.style.height = this.weight / this.permission + "px"
      } else {
        square.style.width = window.outerWidth / this.permission + "px"
        square.style.height = window.outerWidth / this.permission + "px"
      }

      square.classList.add("square")
      field.appendChild(square)

      square.style.backgroundRepeat = "no-repeat";
      if (this.weight < window.outerWidth) {
        square.style.backgroundPositionX = -1 * ((this.weight / this.permission) * x) + "px";
        square.style.backgroundPositionY = -1 * ((this.weight / this.permission) * y) + "px";
        square.style.left = ((this.weight / this.permission) * x) + "px";
        square.style.top = ((this.weight / this.permission) * y) + "px";
      } else {
        square.style.backgroundPositionX = -1 * ((window.outerWidth / this.permission) * x) + "px";
        square.style.backgroundPositionY = -1 * ((window.outerWidth / this.permission) * y) + "px";
        square.style.left = ((window.outerWidth / this.permission) * x) + "px";
        square.style.top = ((window.outerWidth / this.permission) * y) + "px";

      }

      this.squares.push({
        element: square,
        value: i + 1,
        finish: {
          x: x,
          y: y
        },
        position: {
          x: x,
          y: y
        },
        move: false,
        moveX: {
          start: 0,
          end: 0
        },
        moveY: {
          start: 0,
          end: 0
        }
      })

      if (x + 1 == 4) {
        x = 0
      } else {
        x++
      }

      if ((i + 1) % 4 == 0) {
        y = (i + 1) / 4
      }

      square.addEventListener("mousedown", (event) => {
        this.squares[i].move = true
        this.squares[i].moveX.start = event.x
        this.squares[i].moveY.start = event.y
        this.moveElement = i
      })
    }

    document.addEventListener("mouseup", (event) => {
      if (!(typeof this.moveElement == "number")) return;

      this.squares[this.moveElement].move = false
      this.squares[this.moveElement].moveX.end = event.x
      this.squares[this.moveElement].moveY.end = event.y
      this.move(this.moveElement)
    })
  }

  async generate(prompt) {
    this.stop = true
    this.loading.style.display = "block"
    this.url = (await axios.post("/generate-img", {
      weight: this.weight,
      prompt
    })).data.url
    this.loading.style.display = "none"
    this.setImg(this.url)
    this.onHandlers.url.fn(this.url)

    setTimeout(() => {
      this.randomPosition()
    }, 1000)
  }

  setImg(url) {
    this.squares.forEach(square => {
      square.element.style.backgroundImage = `url(${url})`
    })
  }

  setPosition() {
    this.squares.forEach(square => {
      if (this.weight < window.outerWidth) {
        square.element.style.left = ((this.weight / this.permission) * square.position.x) + "px";
        square.element.style.top = ((this.weight / this.permission) * square.position.y) + "px";
      } else {
        square.element.style.left = ((window.outerWidth / this.permission) * square.position.x) + "px";
        square.element.style.top = ((window.outerWidth / this.permission) * square.position.y) + "px";
      }
    })
  }

  randomPosition() {

    const x = [0, 1, 2, 3]
    const y = [0, 1, 2, 3]

    const combinations = [];

    for (let i = 0; i < x.length; i++) {
      for (let j = 0; j < y.length; j++) {
        combinations.push([x[i], y[j]]);
      }
    }

    this.squares.forEach(square => {
      const randomIndex = Math.floor(combinations.length * Math.random())
      const postition = combinations[randomIndex]
      combinations.splice(randomIndex, 1)
      square.position.x = postition[0]
      square.position.y = postition[1]
    });

    if (!this.isSolvable(this.squares.toSorted((a, b) => {
      if (a.position.y < b.position.y) return -1;
      if (a.position.y > b.position.y) return 1;
      if (a.position.x < b.position.x) return -1;
      if (a.position.x > b.position.x) return 1;
      return 0;
    }))) {
      return this.randomPosition(); // Если нерешаемо, запускаем перемешивание снова
    }

    this.setPosition();
    this.stop = false

  }

  move(index) {
    if (this.stop) return;


    const deltaX = this.squares[index].moveX.end - this.squares[index].moveX.start
    const deltaY = this.squares[index].moveY.end - this.squares[index].moveY.start


    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (this.squares[index].moveX.end > this.squares[index].moveX.start) {
        if (this.squares[index].position.x == 3) {
          return
        }
        if (!this.squares.find(el => el.position.x == this.squares[index].position.x + 1 && el.position.y == this.squares[index].position.y)) {
          this.squares[index].position.x++
        }
      } else if (this.squares[index].moveX.end < this.squares[index].moveX.start) {
        if (this.squares[index].position.x == 0) {
          return
        }
        if (!this.squares.find(el => el.position.x == this.squares[index].position.x - 1 && el.position.y == this.squares[index].position.y)) {
          this.squares[index].position.x--
        }
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (this.squares[index].moveY.end > this.squares[index].moveY.start) {
        if (this.squares[index].position.y == 3) {
          return
        }
        if (!this.squares.find(el => el.position.x == this.squares[index].position.x && el.position.y == this.squares[index].position.y + 1)) {
          this.squares[index].position.y++
        }

      } else if (this.squares[index].moveY.end < this.squares[index].moveY.start) {
        if (this.squares[index].position.y == 0) {
          return
        }
        if (!this.squares.find(el => el.position.x == this.squares[index].position.x && el.position.y == this.squares[index].position.y - 1)) {
          this.squares[index].position.y--
        }
      }
    }
    this.setPosition()
    this.moveElement = null
    this.winner()
  }

  // Обработчик окончания касания
  handleTouchEnd(x, y, event) {
    const distX = event.changedTouches[0].clientX - x;
    const distY = event.changedTouches[0].clientY - y;
    // Определение направления свайпа по горизонтали
    if (Math.abs(distX) > 100 && Math.abs(distX) > Math.abs(distY)) {
      if (distX > 0) {
        this.moveMob("right")
      } else {
        this.moveMob("left")
      }
    }

    // Определение направления свайпа по вертикали
    if (Math.abs(distY) > 100 && Math.abs(distY) > Math.abs(distX)) {
      if (distY > 0) {
        this.moveMob("bottom")
      } else {
        this.moveMob("top")
      }
    }

  }

  moveMob(action) {
    let count = 0
    this.squares.forEach(square => {
      if (count) return;

      if (action == "right" && square.position.x != 3 && !this.squares.find(el => el.position.x == square.position.x + 1 && el.position.y == square.position.y)) {
        square.position.x++
        count++
      }
      if (action == "left" && square.position.x != 0 && !this.squares.find(el => el.position.x == square.position.x - 1 && el.position.y == square.position.y)) {
        square.position.x--
        count++
      }
      if (action == "top" && square.position.y != 0 && !this.squares.find(el => el.position.x == square.position.x && el.position.y == square.position.y - 1)) {
        square.position.y--
        count++
      }
      if (action == "bottom" && square.position.y != 3 && !this.squares.find(el => el.position.x == square.position.x && el.position.y == square.position.y + 1)) {
        square.position.y++
        count++
      }

    })

    this.setPosition()
  }

  on(name, callback) {
    this.onHandlers[name].fn = callback
  }

  winner() {
    const every = (el) => el.position.x == el.finish.x && el.position.y == el.finish.y
    if (this.squares.every(every)) {
      this.win.classList.add("active")
    }
  }

  countInversions(squares) {
    let inversionCount = 0;
    for (let i = 0; i < squares.length; i++) {
      for (let j = i + 1; j < squares.length; j++) {
        if (squares[i] && squares[j] && squares[i].value > squares[j].value) {
          inversionCount++;
        }
      }
    }
    return inversionCount;
  }

  isSolvable(squares) {
    const inversions = this.countInversions(squares);
    // Определение позиции пустой плитки относительно нижнего ряда
    const emptySquareRowFromBottom = Math.floor(squares.findIndex(square => !square.value) / 4);
    // Если количество рядов снизу четное, то добавляем 1 к числу инверсий
    return (inversions + emptySquareRowFromBottom) % 2 === 0;
  }
}

