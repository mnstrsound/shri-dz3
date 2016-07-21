function Player(elem, options) {
    var _this = this;

    elem.innerHTML = '';
    this.elem = elem;
    this.subtitled = false;
    this.subtitleCounter = undefined;
    this.subtitleStartTime = undefined;
    this.subtitleEndTime = undefined;
    this.options = Object.assign({}, this.defaultOptions, options);
    this.createVideoElement();
    this.createAudioElement();
    this.destroySound();
    this.createPlayer();
    this.setEventListeners();
    this.getSubtitles().then(function (data) {
        _this.subtitles = _this.parseSubtitles(data);
        _this.currentSubtitle = _this.subtitles[0];
    });
};

Player.prototype.defaultOptions = {
    textOffsetTop: 80,
    textMaxWidth: 420,
    textLineHeight: 40,
    width: 480,
    height: 270,
    audioSource: '../media/audio.ogg',
    videoSource: '../media/video.mp4',
    subtitlesSource: '../media/subtitles.srt'
};

Player.prototype.startSubtitle = function (time) {
    var _this = this;

    this.subtitled = true;
    this.subtitleStartTime = new Date();
    this.subtitleCounter = setTimeout(function () {
        if (_this.subtitles.indexOf(_this.currentSubtitle) < _this.subtitles.length - 1) {
            _this.currentSubtitle = _this.subtitles[_this.subtitles.indexOf(_this.currentSubtitle) + 1];
        }
        _this.subtitleStartTime = undefined;
        _this.subtitleEndTime = undefined;
        _this.subtitled = false;
        _this.video.play();
    }, time);
};

Player.prototype.destroySound = function () {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioCtx = new AudioContext();
    var source = audioCtx.createMediaElementSource(this.audio);
    var gainNode = audioCtx.createGain();
    var biquadFilter = audioCtx.createBiquadFilter();

    gainNode.gain.value = 5;
    biquadFilter.type = 'highpass';
    source.connect(biquadFilter);
    biquadFilter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
};

Player.prototype.getSubtitles = function () {
    var _this = this;
    var promise = new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', _this.options.subtitlesSource, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4) return;
            if (xhr.status != 200) {
                reject(xhr.status + ': ' + xhr.statusText);
            } else {
                var data = xhr.responseText;
                resolve(data);
            }
        };
    });

    return promise;
};

Player.prototype.parseSubtitles = function (data) {
    var parsed = [];
    var subtitles = data.replace(/\r\n|\r|\n/g, '\n');

    function strip(str) {
        return str.replace(/^\s+|\s+$/g, "");
    }

    subtitles = strip(subtitles);
    subtitles = subtitles.split('\n\n');

    for (var i = 0, len = subtitles.length; i < len; i++) {
        var subtitle = subtitles[i].split('\n');
        if (subtitle.length >= 2) {
            var number = subtitle[0];
            var time = subtitle[1].split(' --> ');
            var timeStart = parseTime(time[0]);
            var timeEnd = parseTime(time[1]);
            var text = subtitle[2];
            if (subtitle.length > 2) {
                for (var j = 3; j < subtitle.length; j++) {
                    text += '\n' + subtitle[j];
                }
            }
            parsed[i] = {};
            parsed[i].number = number;
            parsed[i].start = timeStart;
            parsed[i].end = timeEnd;
            parsed[i].text = text;
        }
    }

    function parseTime(time) {
        var parsed = strip(time).split(':');

        return (parseInt(parsed[0] * 3600) + parseInt(parsed[1]) * 60 + parsed[2].replace(',', '') / 1000) * 1000;
    }

    return parsed;
};

Player.prototype.createPlayer = function () {
    var player = document.createElement('div');
    var controls = document.createElement('div');
    var play = document.createElement('div');
    var pause = document.createElement('div');

    player.classList.add('player', 'player--paused');
    player.style.width = this.options.width + 'px';
    controls.classList.add('player__controls');
    play.classList.add('player__control', 'player__control--play');
    pause.classList.add('player__control', 'player__control--pause');

    controls.appendChild(play);
    controls.appendChild(pause);
    player.appendChild(controls);

    this.controls = {
        play: play,
        pause: pause
    };

    this.elem.appendChild(player);
    this.player = player;
    this.createCanvas();
};

Player.prototype.createCanvas = function () {
    var canvas = document.createElement('canvas');
    //var mask = document.createElement('canvas');

    canvas.width = this.options.width;
    canvas.height = this.options.height;
    //mask.width = this.options.width;
    //mask.height = this.options.height;

    this.player.appendChild(canvas);
    //this.player.appendChild(mask);
    this.context = canvas.getContext('2d');
    this.canvas = canvas;
    //this.mask = mask;
    //this.maskContext = mask.getContext('2d');
};

Player.prototype.createVideoElement = function () {
    var video = document.createElement('video');

    video.width = this.options.width;
    video.height = this.options.height;
    video.controls = 'controls';
    video.muted = 'muted';
    video.classList.add('video');
    this.elem.appendChild(video);
    this.video = video;
    this.createVideoSource();
};

Player.prototype.createVideoSource = function () {
    var sources = this.video.getElementsByTagName('source');
    var source = document.createElement('source');

    if (sources.length > 0) {
        this.video.removeChild(sources[0]);
    }

    source.setAttribute('src', this.options.videoSource);
    this.video.appendChild(source);
};

Player.prototype.createAudioElement = function () {
    var audio = document.createElement('audio');

    this.elem.appendChild(audio);
    this.audio = audio;
    this.createAudioSource();
};

Player.prototype.createAudioSource = function () {
    var sources = this.audio.getElementsByTagName('source');
    var source = document.createElement('source');

    if (sources.length > 0) {
        this.audio.removeChild(sources[0]);
    }

    source.setAttribute('src', this.options.audioSource);
    this.audio.appendChild(source);
};

Player.prototype.reset = function () {
    this.currentSubtitle = this.subtitles[0];
    this.video.currentTime = 0;
    this.audio.currentTime = 0;
    this.pause();
};

Player.prototype.setEventListeners = function () {
    var _this = this;

    this.video.addEventListener('play', function () {
        _this.audio.play();
        _this.timerCallback();
    }, false);

    this.video.addEventListener('pause', function () {

    }, false);

    this.video.addEventListener('ended', function () {
        _this.reset();
    }, false);

    this.controls.play.addEventListener('click', function () {
        _this.play();
    }, false);

    this.controls.pause.addEventListener('click', function () {
        _this.pause();
    }, false);
};

Player.prototype.play = function () {
    if (this.subtitled) {
        this.startSubtitle(this.subtitleEndTime);
    } else {
        this.video.play();
    }
    this.player.classList.remove('player--paused');
    this.player.classList.add('player--playing');
    this.audio.play();
};

Player.prototype.pause = function () {
    if (this.subtitled) {
        var now = new Date();

        clearTimeout(this.subtitleCounter);
        this.subtitleCounter = undefined;
        this.subtitleEndTime = this.currentSubtitle.end -
                               this.currentSubtitle.start -
                               (now - this.subtitleStartTime);
    }

    this.player.classList.remove('player--playing');
    this.player.classList.add('player--paused');
    this.video.pause();
    this.audio.pause();
};

Player.prototype.computeFrame = function () {
    this.context.drawImage(this.video, 0, 0, this.options.width, this.options.height);
    var frame = this.context.getImageData(0, 0, this.options.width, this.options.height);
    var l = frame.data.length / 4;
    for (var i = 0; i < l; i++) {
        var grey = .2126 * frame.data[i * 4 + 0] +
                   .7152 * frame.data[i * 4 + 1] +
                   .0722 * frame.data[i * 4 + 2];

        frame.data[i * 4 + 0] = grey;
        frame.data[i * 4 + 1] = grey;
        frame.data[i * 4 + 2] = grey;
    }
    this.context.putImageData(frame, 0, 0);
};

Player.prototype.timerCallback = function () {
    var _this = this;

    if (this.video.paused || this.video.ended) {
        return;
    }

    if (this.video.currentTime * 1000 >= _this.currentSubtitle.end
        && _this.subtitles.indexOf(_this.currentSubtitle) !== _this.subtitles.length - 1) {
        this.subtitled = true;
        this.video.pause();
        this.context.fillStyle = "black";
        this.context.rect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fill();
        this.context.font = "35px Oranienbaum";
        this.context.fillStyle = "white";
        this.printText(
            this.currentSubtitle.text,
            (this.options.width - this.options.textMaxWidth) / 2,
            this.options.textOffsetTop, this.options.textMaxWidth,
            this.options.textLineHeight
        );
        this.startSubtitle(_this.currentSubtitle.end - _this.currentSubtitle.start);
        return;
    }
    this.computeFrame();
    setTimeout(function () {
        _this.timerCallback();
    }, 16);
};

Player.prototype.printText = function (text, marginLeft, marginTop, maxWidth, lineHeight) {
    var words = text.split(' ');
    var wordsCount = words.length;
    var line = "";

    for (var i = 0; i < wordsCount; i++) {
        var testLine = line + words[i] + " ";
        var testWidth = this.context.measureText(testLine).width;
        if (testWidth > maxWidth) {
            this.context.fillText(line, marginLeft, marginTop);
            line = words[i] + " ";
            marginTop += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    this.context.fillText(line, marginLeft, marginTop);
};

window.onload = function () {
    var wrapper = document.getElementById('player');
    var form = document.getElementById('form');
    var inputs = document.querySelectorAll('input[type="text"]');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var valid = true;
        var options = {};

        inputs.forEach(function (input) {
            if (!input.value.length) {
                input.classList.add('form__input--error');
                valid = false;
            } else {
                options[input.getAttribute('name') + 'Source'] = input.value;
                input.classList.remove('form__input--error');
            }
        });

        if (valid) {
            var player = new Player(wrapper, options);
        }

    }, false);

    var player = new Player(wrapper, {});
};