

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
      /*  if (event.data == YT.PlayerState.PAUSED ) {
          player.loadVideoById("bHQqvYy5KYo", 5, "large");
      }*/
    }
      function stopVideo() {
        player.stopVideo();
      }



      //viene riempita la lista delle canzoni iniziali
      function grafica(data){
          for (var i = 0; i < data.length; i++) {
             $("#main").append("<button data-dismiss='modal' onclick='caricavideo("+JSON.stringify(data[i].videoID)+")'>"+data[i].category+ data[i].artist+data[i].title+data[i].videoID+"</button>");
          }
        }

        function caricavideo(data){
          // console.log(JSON.stringify(data));
           player.loadVideoById(data, 0, "large");
           setTimeout(salvarecent,20000,data);

        }

        var recommender_size=20;    //dimensione tabella degli ultimi video visitati
        var shift=10;   //siccome la chiave 0 (=null) é melgio non usarla, viene sciftato tutto di shift (non é importante quanto valga)
        function salvarecent(ID){
          var key=localStorage.getItem("counter");  //counter=valore della prossima chiave libera 
          if (key==null)    //se non esiste già
            key=shift;  
          localStorage.setItem(key, ID);
          key++;
          key=(key-shift)%recommender_size+shift;
          localStorage.setItem("counter", key);

          console.log(ID);
        }
        function caricarecent(out){
          var i;
          for(i=0;i<recommender_size;i++){
          key=(localStorage.getItem("counter")-shift-i-1+recommender_size)%recommender_size+shift;
          var video=localStorage.getItem(key);
          if (video==null)
            return i;   //dimensione di out

          out[i]= video;     //returna null se l'eselmento non esiste
          }
          return recommender_size;
        }


        function riempi(){
          $.ajax({

            url: "http://site1825.tw.cs.unibo.it/video.json",
            success: function(data) {

              grafica(data);
             
            },
            error: function(data) {
              alert("Caricamento impossibile");
            }
          });       
        }
       function stampa(vid, dim){
        var html="";
          for (var i = 0; i < dim; i++) {
            html+="<img width=7% heigth=7% src ='https://img.youtube.com/vi/"+vid[i]+"/0.jpg'>";
          }
          $(".tabcontent").html(html);
        }

        function caricaTab(evt, category) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            document.getElementById(category).style.display = "block";
            evt.currentTarget.className += " active";

            var dim=recommender_size;
            var vid=[recommender_size];
            if(category=="Recent")
              dim=caricarecent(vid);
            stampa(vid,dim);
        }
        


