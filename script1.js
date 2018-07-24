

      // 2. This code loads the IFrame Player API code asynchronously.
      var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.
      var currentVideo="qjQT26RGjwg";

      //timer per controllare i secondi di video passati prima di salvarlo
      var clock;
      var timerOn;
      var time;

      function timedCount(){
        time=time+1;
        if(time==10)
          salvarecent(currentVideo);
        if(time<10)
          clock=setTimeout(timedCount, 1000);
      }

      function startClock(){
        if(!timerOn){
          timerOn=1;
          timedCount();
        }
      }
      function newClock(){
        timerOn=0;
        time=0;

      }
      function stopClock(){
        clearTimeout(clock);
        timerOn=0;

      }
      //inizializzazione player
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

      
      function onPlayerReady(event) {
        event.target.playVideo();
      }

     
     var done = false;
      function onPlayerStateChange(event) {
       if(event.data == YT.PlayerState.PLAYING){
          startClock();
          //setTimeout(salvarecent,3000,currentVideo);
       }
        if(event.data == YT.PlayerState.PAUSED){
          stopClock();
       }
      }
      



      //viene riempita la lista delle canzoni iniziali
      function grafica(data){
          for (var i = 0; i < data.length; i++) {
             $("#main").append("<button data-dismiss='modal' onclick='caricavideo("+JSON.stringify(data[i].videoID)+")'>"+data[i].category+ data[i].artist+data[i].title+data[i].videoID+"</button>");
          }
        }

        function caricavideo(data){
            newClock();
            currentVideo=data;
           player.loadVideoById(data, 0, "large");
          
        }

        var recommender_size=20;    //dimensione tabella degli ultimi video visitati
        function salvarecent(ID){
          var vid=[recommender_size];
          var dim=caricarecent(vid);
          var exist=false;
          for (var i = 0; i <dim; i++) {
           if(ID==vid[i])
              exist=true;
          }
          if(!exist){
                var key=localStorage.getItem("counter");  //counter=valore della prossima chiave libera 
                if (!key)    //se non esiste già
                  key=0;  
                localStorage.setItem(key, ID);
                key++;
                key=key%recommender_size;
                localStorage.setItem("counter", key);
          }
          console.log(ID);
        }
        function caricarecent(out){
          var i;
          for(i=0;i<recommender_size;i++){
          key=(localStorage.getItem("counter")-i-1+recommender_size)%recommender_size;
          var video=localStorage.getItem(key);
          if (video==null)
            return i;   //dimensione di out

          out[i]= video;     //returna null se l'eselmento non esiste
          }
          return recommender_size;
        }

        //aggiunge la lista di canzoni iniziale
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
        //riempie i recommender
       function stampa(vid, dim){
        var html="";
          for (var i = 0; i < dim; i++) {
            html+="<img width=7% heigth=7% src ='https://img.youtube.com/vi/"+vid[i]+"/0.jpg' value='"+vid[i]+"'>";
          }
          $(".tabcontent").html(html);
        }

       // $('img').click(caricavideo($(this).value));
         

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
            
            //$('img').click(caricavideo,$(this).attr("value"));
           $('img').click(function(){
                caricavideo($(this).attr("value"));
           });
           
            
        
        }
        


