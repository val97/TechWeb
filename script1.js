

      // 2. This code loads the IFrame Player API code asynchronously.
      var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.
      var player;
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          height: '390',
          width: '640',
          videoId: 'qjQT26RGjwg',
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
      }

      // 4. The API will call this function when the video player is ready.
      function onPlayerReady(event) {
        event.target.playVideo();
      }

      // 5. The API calls this function when the player's state changes.
      //    The function indicates that when playing a video (state=1),
      //    the player should play for six seconds and then stop.
     var done = false;
      function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING && !done) {
          setTimeout(stopVideo, 6000);
          done = true;
        }
      }
      function stopVideo() {
        player.stopVideo();
      }
//con jquery bisogna trovare il modo di dire che il link è stato cliccato e far riempire il modale
    //  $("#lista").onClick(riempi());

      function grafica(data){
          for (var i = 0; i < data.length; i++) {
            $("#main").append("<button>"+data[i].category+ data[i].artist+data[i].title+data[i].videoID+"</button>");
          }
        }
        function riempi(){
          $.ajax({

            url: "http://site1825.tw.cs.unibo.it/video.json",
            success: function(data) {
              grafica(data);
              //$("#main").append("ciao"+ data[i].category);


            },
            error: function(data) {
              alert("Caricamento impossibile");
            }
          });       
        }
    

