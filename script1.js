 console.log("ho chiamato lo script");

      var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
      
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.
      var currentVideo="DPDJpFnUgZw";

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
          rel: 0, //non inseerisci i video suggeriti da yt nel player
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

//            e.preventDefault();
          var q = currentVideo;
          var request = gapi.client.request({
            'method': 'get',
            'path': '/youtube/v3/commentThreads',
            'params':{
              'part': 'snippet, replies',
              'videoId': q
            }
          });
          request.execute(function(response){
            console.log("ciao");
            var i;
            var html="";  
              for(i=0; i<response.items.length && i<20   ; i++){
                  html+="<img width='28' heigth='28' src="+JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorProfileImageUrl)+"> <b> "+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorDisplayName).slice(1,-1) +" </b> <br> "+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.textOriginal)+"<hr>";
             // $('#comments_container').append("<li> autore:"+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorDisplayName) +" testo:"+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.textOriginal)+"</li>");
                $('#comment_container').html(html);
            //  console.log("<li> autore:"+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorDisplayName) +" testo:"+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.textOriginal)+"</li>");
              }
               });
          //setTimeout(salvarecent,3000,currentVideo);
        //DESCRIZIONE E TITOLO
          var request1 = gapi.client.youtube.videos.list({
            'method': 'get',
            'path': '/youtube/v3/videos',
              'id': q,
              'part': 'snippet'



          });
          request1.execute(function(response){
            console.log("dentro");
            //document.getElementById('description').innerHTML= "descrizione:"+JSON.stringify(response.items[0].snippet.description);
            //document.getElementById('title').innerHTML= "titolo:"+JSON.stringify(response.items[0].snippet.title);
            var title="";
            var desc="";
            title +="<b><h2>"+JSON.stringify(response.items[0].snippet.title)+"</h2></b>";
            desc += "<p>"+JSON.stringify(response.items[0].snippet.description)+"</p>";
             $('#description_container').html(desc);
            $('#title_container').html(title);

          });
        
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
            player.loadVideoById(data, 0, "large");  //"0" secondi di inizio del video
          
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
       //   console.log(ID);
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
       function stampa(vid, dim,category){
        //category="#"+category;
      //  console.log(category);
        var html="";
          for (var i = 0; i < dim; i++) {
            html+="<img width=7% heigth=7% src ='https://img.youtube.com/vi/"+vid[i]+"/0.jpg' value='"+vid[i]+"'>";
          }
          $(".tabcontent#"+category).html(html);
        }

       // $('img').click(caricavideo($(this).value));
         
        var resSearch="";
        var resRand="";
        var Fvit="";

        function caricaTab(category) {
            console.log(category);

            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            //NON SO SE SERVONO O COSA FANNO
            document.getElementById(category).style.display = "block";
           // evt.currentTarget.className += " active";

            var dim=recommender_size;
            var vid=[recommender_size];

            if(category=="Recent")
              dim=caricarecent(vid);
            
            if (category=="search") {
              //controllo se sto cercando per id, se vero lancio direttamente il video legato all' id
              if(resSearch.items[0].id.videoId==$('#query').val()){ 
                  dim=0;
                  caricavideo(resSearch.items[0].id.videoId);
              }
              //visualizzo la lista dei video cercati
              else{     
                  dim=resSearch.items.length;
                  for (var i = 0; i < dim; i++) {
                      vid[i]=resSearch.items[i].id.videoId;
                      console.log(resSearch);
                  }
              }
            }
            if(category=="Fvitali"){
              dim=Fvit.recommended.length;
              for (var i = 0; i <dim; i++) {
                console.log(Fvit.recommended[i]);
                vid[i]=Fvit.recommended[i].videoID;
              }
            }

            //PROBLEMA:
            //        DOPO IL PRIMO CLICK RESRAND È VUOTA QUANDO ENTRA IN QUESTO PUNTO
                      //dOVE VIENE FATTA LA RICERCA RESRAND È PIENA
            if (category=="Random") {
              console.log("risp: "+resRand);
              dim=20;
              for (var i = 0; i < 20; i++) {
                  vid[i]=resRand.items[i].id.videoId;
              }
            }
         
          if(category =="Related"){
              //console.log("related");

              var request_related = gapi.client.request({
              'method': 'get',
              'path': '/youtube/v3/search',
              'params':{
                'part': 'snippet',
                'relatedToVideoId': currentVideo,
                'type': 'video',
                'maxResults':recommender_size
              }
            });
            request_related.execute(function(response){
              //console.log(response);
              var html="";

              for(var j=0; j< recommender_size; j++){
                vid[j]=response.items[j].id.videoId;
                html += "<div  class='card border-info mb-3' style='width: 16rem;'>";
                    html+=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+vid[j]+"/default.jpg' value='"+vid[j]+"' alt='Card image cap'>";
                  html += "<div class='card-body'> <p class='card-text'><b>"+ response.items[j].snippet.title +"</b><br>"+response.items[j].snippet.channelTitle+"<br>"+ (response.items[j].snippet.publishedAt).slice(0,-14)+"</p></div></div> ";
              }

              $(".tabcontent#"+category).html(html);
              console.log(response);

            });
            }
            stampa(vid,dim,category);
            
            //$('img').click(caricavideo,$(this).attr("value"));
           $('img').click(function(){
                caricavideo($(this).attr("value"));
           });
           
            
       
        }
        function makeid() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            text = possible.charAt(Math.floor(Math.random() * possible.length));
            return text;
        }

        

        
         
        // inserita search luci

        $(document).ready(function(){   
          $("#search-button").click(function(e){
            e.preventDefault();
            var q = $('#query').val();
            if(q){
                var request = gapi.client.youtube.search.list({
                      q:q,
                      part: 'id ,snippet',
                      type: 'video',                //servono per far cercare soltanto video musicali
                      videoCategoryId: '10'
                });
                request.execute(function(response){
                  console.log(response);
                  resSearch=response;
                  $('#searched').click(caricaTab('search'));
                });
            }
          });

           $("#random-button").click(function(e){
            e.preventDefault();
            var q = makeid();
            //console.log(q);
            var request = gapi.client.youtube.search.list({
                  q:q,
                  part: 'snippet',
                  type: 'video',                //servono per far cercare soltanto video musicali
                  videoCategoryId: '10',
                  maxResults: 50
            });
            request.execute(function(response){
            
              var rnd=Math.floor(Math.random()*response.items.length);
              resRand=response;
              $('#random-button').click(caricaTab('Random'));
               console.log(response);
               console.log(resRand);
            });
          });

        
         $("#Fvitali-button").click(function(e){
            $.ajax({

            url: "http://site1825.tw.cs.unibo.it/TW/globpop?id=yRIPU1zZbuk",
            success: function(data) {

              console.log(data);
              Fvit=data;
              $('#Fvitali-button').click(caricaTab('Fvitali'));
              console.log(data.recommended.length);
              console.log(data.recommended[0]);
              console.log(data.recommended[1]);
             
            },
            error: function(data) {
              alert("Caricamento impossibile");
            }
          });    
          });    


        });
        function init(){
          console.log("pippo");
          gapi.client.setApiKey("AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ");
          gapi.client.load("youtube","v3",function(){ });
}
