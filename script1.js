var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
      
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      
      var recommender_size=20;    //dimensione tabella degli ultimi video visitati
      var currentVideo="8of3uhG1tCI";
      var lastVideo=null; //video precedente a quello attualmente visto
      var last_reason=null;
      var current_reason=null;
      //timer per controllare i secondi di video passati prima di salvarlo
      var clock;
      var timerOn=0;
      var time;


      function savePopularity(){
        $.get("http://localhost:8000/popularity?to_id="+currentVideo+"&reason="+current_reason, function(data, status){
          
        });
        var vid_recent=[recommender_size];
        var size=caricarecent(vid_recent);
        var flag=false;
        if(lastVideo!=currentVideo)
          for(var i=0;i<size;i++){
            if(lastVideo==vid_recent[i]){
              $.get("http://localhost:8000/popularity?from_id="+lastVideo+"&to_id="+currentVideo+"&reason="+current_reason, function(data, status){
                    //alert("last video: " + lastVideo + "\this video: " + currentVideo);
              });
            }
          }
      }
      function caricaPopularity(ask,out){
        var prom=new Promise(function(resolve,reject){
          $.get("http://localhost:8000/popularity?from_id="+currentVideo+"&ask="+ask, function(data, status){
              var v=JSON.parse(data);
            for(var i = 0;i<v.length;i++)
              out[i]=v[i].to_id;
            
              resolve(v.length);
          });
        });
        return prom;
      }
      function saveReason(category){
        var out="undefined";
        if((category=="popLocAss")||(category=="popLocRel")){
          out="LocalPopularity";
        }else if((category=="popGlobAss")||(category=="popGlobRel")){
          out="GlobalPopularity";
        }else out=category;
       last_reason=out;
      }
      function timedCount(){
        time=time+1;
        if(time==10){ //se il viddeo e' stato visto
          salvarecent(currentVideo);
        savePopularity();
    
        }
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
          videoId: currentVideo,
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

function  cutTitle(data){
      var  title=data;

        title=title.split("-");
        //console.log(title);
        if(title.length==1){

          title=title[0].split("|");

        }if(title.length>1){

          artist=title[0].trim();
          title[0]=title[0].trim();
          var titolo=title[1].split("(");

        }
         // console.log("titolo"+titolo);
         return(titolo);
    }
      //prende titolo e nome dell'artista
         function getDbpediaInfo(){
          var currVid;
          var artist="";
          var title="";

           $.ajax({
                           url: 'https://www.googleapis.com/youtube/v3/videos?key=' + 'AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ' + '&id=' + currentVideo + '&part=snippet',
                           success: function(data){ currVid=data.items[0];},

                           complete: function(){
  var titolo;
                              titolo=cutTitle(currVid.snippet.title);

                            /*  title=currVid.snippet.title;

                              title=title.split("-");
                              //console.log(title);
                              if(title.length==1){

                                title=title[0].split("|");

                              }if(title.length>1){

                                artist=title[0].trim();
                                title[0]=title[0].trim();
                                var titolo=title[1].split("(")
                               // console.log("titolo"+titolo);
                               */
                                $.get("http://localhost:8000/abstract?artist="+artist+"&title="+titolo[0].trim(), function(data, status){

                                 if(data.results.bindings[0]){
                                    var wiki=data.results.bindings[0];
                                    var artist=data.results.bindings[0].abstract;
                                    if(data.results.bindings[0].Sabstract){
                                      $('#wiki_container').html(wiki.value);
                                      $('#artist_container').html(artist.value);
                                    }
                                  }
                                    else{
                                      $('#wiki_container').html("no abs founded\n");
                                      $('#artist_container').html("no abs founded\n");
                                    }
                                    
                                });
                                $.get("http://localhost:8000/info?artist="+artist+"&title="+titolo[0].trim(), function(data, status){
                                  console.log("risposta: ");
                                   
                                   if(data.results.bindings[0]){
                                    var info=data.results.bindings[0];
                                     if(info.album.value)
                                        $('#info_container').append("<a href= "+info.album.value+">album:" +info.album.value+"</a><br>");
                                     if(info.artName.value) 
                                        $('#info_container').append("artista" +info.artName.value+"<br>");
                                    if(info.relDate.value)
                                        $('#info_container').append("relDate" +info.relDate.value+"<br>");
                                      if(info.wik.value)
                                        $('#info_container').append("wiki" +info.wik.value+"<br>");
                                }
                                });

                            }
                         }
           });
         }

     
      var done = false;
      function onPlayerStateChange(event) {
       if(event.data == YT.PlayerState.PLAYING){
          startClock();
          getDbpediaInfo();
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
            var i;
            var html="";  
              for(i=0; i<response.items.length && i<20   ; i++){
                  html+="<img width='28' heigth='28' src="+JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorProfileImageUrl)+"> <b> "+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorDisplayName).slice(1,-1) +" </b> <br> "+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.textOriginal)+"<hr>";
                  $('#comment_container').html(html);
              }
          });
      
        //DESCRIZIONE E TITOLO
          var request1 = gapi.client.youtube.videos.list({
            'method': 'get',
            'path': '/youtube/v3/videos',
              'id': q,
              'part': 'snippet'
          });
          request1.execute(function(response){
            var title="";
            var desc="";
            title +="<b><h2>"+JSON.stringify(response.items[0].snippet.title)+"</h2></b>";
            desc += "<p>"+JSON.stringify(response.items[0].snippet.description)+"</p>";
            $('#description_container').html(desc);
            $('#title_container').html(title);
          });
        
       }
        if(event.data == YT.PlayerState.PAUSED)
          stopClock();
      }
      



      //viene riempita la lista delle canzoni iniziali
      function loadCatalog(data){
          for (var i = 0; i < data.length; i++) {
             main += "<div  class='card border-info mb-3' style='width: 16rem;height: 20rem; display: inline-block;'>";
            main +=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+(JSON.stringify(data[i].videoID)).slice(1,-1)+"/default.jpg' value='"+JSON.stringify(data[i].videoID)+"' alt='Card image cap'>";
             main += "<div class='card-body'> <p class='card-text'><b>"+ data[i].title +"</b><br>"+data[i].category+"<br>"+ data[i].artist+"</p></div></div> ";
          }
          $(".container-fluid").html(main);
        }

        function caricavideo(data){
            newClock();
           lastVideo=currentVideo;
            currentVideo=data;
            player.loadVideoById(data, 0, "large");  //"0" secondi di inizio del video
            current_reason=last_reason;
             $('#wiki_container').html(" ");
            $('#artist_container').html(" ");
            var stateObj = {id:data};
            history.pushState(stateObj , data, "?id="+data);
            caricaTab("Recent");

           
        }
  function historyBack(id){
            newClock();
            lastVideo=null;
            currentVideo=id;
            player.loadVideoById(id, 0, "large");  //"0" secondi di inizio del video
        }

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

              loadCatalog(data);
             
            },
            error: function(data) {
              alert("Caricamento impossibile");
            }
          });       
        }
        //riempie i recommender
       function stampa(vid, dim,category,info){
         var html="";
         for (var i = 0; i < dim; i++) {
            if(vid[i] != "undefined"){

                if(info){
                    html += "<div  class='card border-info mb-3' style='width: 16rem;display: inline-block;'>";
                    html+=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+vid[i].id.videoId+"/default.jpg' value='"+vid[i].id.videoId+"' alt='Card image cap'>";
                    html += "<div class='card-body'> <p class='card-text'><b>"+ vid[i].snippet.title +"</b><br>"+vid[i].snippet.channelTitle+"<br>"+ (vid[i].snippet.publishedAt).slice(0,-14)+"</p></div></div> ";
                } else{

                  html += "<div  class='card border-info mb-3' style='width: 16rem; display: inline-block;'>";
                  html+=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+vid[i].id+"/default.jpg' value='"+vid[i].id+"' alt='Card image cap'>";
                  html += "<div class='card-body'> <p class='card-text'><b>"+ vid[i].snippet.title +"</b><br>"+vid[i].snippet.channelTitle+"<br>"+ (vid[i].snippet.publishedAt).slice(0,-14)+"</p></div></div> ";

              }
            }
          }
          $(".tabcontent#"+category).html(html);

          $('img').click(function(){
                caricavideo($(this).attr("value"));
          });
        }
       
        var resSearch="";
        var resRand="";
        var Fvit="";
        var resRel="";

        function caricaTab(category) {
            saveReason(category);

            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            //serve per inserire le immagini nel tab
            document.getElementById(category).style.display = "block";
           
            var dim=recommender_size;
            var vid=[recommender_size];
            var info=true;

            function takeInfoById(j){
              $.ajax({
                           url: 'https://www.googleapis.com/youtube/v3/videos?key=' + 'AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ' + '&id=' + vid[j] + '&part=snippet',
                           success: function(data){
                              vid[j]=data.items[0];
                              j++;
                           } ,
                           complete: function(){
                              if(j<20)
                                takeInfoById(j);
                             if(j==20)
                                stampa(vid,dim,category,info);
                           }
                        });
            }


            if(category=="Recent"){
              info=false
              dim=caricarecent(vid);
              var j=0;

              takeInfoById(j);
                   
              }
            if((category=="popLocAss")||(category=="popLocRel")||(category=="popGlobAss")||(category=="popGlobRel")){
              info=false
              var prom=caricaPopularity(category,vid);
              prom.then(function(d){
              dim=d;
                var j=0;
                takeInfoById(j);
        });      
            }
            
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
                      vid[i]=resSearch.items[i];
                  }
                   stampa(vid,dim,category,info);
  
              }
            }
            if(category=="Fvitali"){
              dim=Fvit.recommended.length;
              for (var i = 0; i <dim; i++) {
                vid[i]=Fvit.recommended[i].videoID;

              } 
              info =false;
              var j=0;
                  takeInfoById(j);
            }

           
            if (category=="Random") {
              dim=20;
              for (var i = 0; i < 20; i++) {
                  vid[i]=resRand.items[i];
              }
               stampa(vid,dim,category,info)
  
            }
         
          if(category =="Related"){
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
                resRel=response;
                for(i=0;i<recommender_size;i++){
                  vid[i]=resRel.items[i];
                }
                stampa(vid,dim,category,info)
  
              });
            }
              if(category== "ArtistSimilarity"){
                  var currVid;
                  var html="";
                  
                  $.ajax({
                      url: 'https://www.googleapis.com/youtube/v3/videos?key=' + 'AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ' + '&id=' + currentVideo + '&part=snippet',
                      success: function(data){ currVid=data.items[0];},

                      complete: function(){
  var titolo;
                        titolo=cutTitle(currVid.snippet.title);
                            /*  title=currVid.snippet.title;

                              title=title.split("-");
                              //console.log(title);
                              if(title.length==1){

                                title=title[0].split("|");

                              }if(title.length>1){

                                artist=title[0].trim();
                                title[0]=title[0].trim();
                                var titolo=title[1].split("(");
                                console.log("titolo" + titolo[0]);
                              }*/
                              $.get("http://localhost:8000/Artist?title="+titolo[0].trim(), function(data, status){

                                    var artist="";
                                    var album="";

                                    console.log(data);

                                    console.log("status: "+status);

                                    if(data.results.bindings.length>0){
                                      for(var k=0; k<data.results.bindings.length; k++){
                                        artist=data.results.bindings[k].artName.value;
                                        //var album=data.results.bindings[0].album;
                                        //var date=data.results.bindings[0].date;


                                        console.log("artist: "+artist);
                                        $.get("http://localhost:8000/Song?artist="+artist, function(data, status){
                                          //console.log("data:  "+data.results.bindings[0].albumName.value);
                                          if(data.results.bindings.length>0){
                                            album=data.results.bindings[0].albumName.value;
                                            var date="";
                                            date=data.results.bindings[0].date;
                                            if(data.results.bindings[0].songName){

                                              for(var j=0;j<recommender_size;j++){
                                                var songs="";
                                                songs=data.results.bindings[j].songName.value;
                                                console.log("songs: ");
                                                console.log(songs);
                                                $.ajax({
                                                  cache: false,
                                                  data: {
                                                    key:'AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ',
                                                    q:songs,
                                                    part:'id,snippet',
                                                    maxResults:1},
                                                    dataType:'json',
                                                    type:'GET',
                                                    url:'https://www.googleapis.com/youtube/v3/search'
                                                  })

                                                  .done(function(data) {
                                                    console.log(data.items[0]);

                                                    html += "<div  class='card border-info mb-3' style='width: 16rem;display: inline-block;'>";
                                                    html+=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+data.items[0].id.videoId+"/default.jpg' value='"+data.items[0].id.videoId+"' alt='Card image cap'>";
                                                    html += "<div class='card-body'> <p class='card-text'><b>"+ data.items[0].snippet.title +"</b><br>"+data.items[0].snippet.channelTitle+"<br>"+ (data.items[0].snippet.publishedAt).slice(0,-14)+"</br><br>"+artist+"</br><br>"+album+"</br></p></div></div> ";

                                                    //console.log(html);
                                                    $(".tabcontent#"+category).html(html);
                                                  });
                                                }
                                              }
                                            }
                                              else {
                                        
                                        $('#ArtistSimilarity').html('<h1>Sorry</h1><br><h3>Not found!</h3>');
                                     
                                      }
                                          });
                                        }
                                      }
                                    });
                                  }
                                });
                                 $(".tabcontent#"+category).html(html);
          html="";
                              }
              
              
   if(category== "GenreSimilarity"){

      var currVid;
      var html="";
      var artist="";
      $.ajax({
        url: 'https://www.googleapis.com/youtube/v3/videos?key=' + 'AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ' + '&id=' + currentVideo + '&part=snippet',
                    success: function(data){ currVid=data.items[0];},

                    complete: function(){
                           var titolo;
                      titolo=cutTitle(currVid.snippet.title);
                        /*  title=currVid.snippet.title;
                          console.log(title);
                          title=title.split("-");
                          console.log(title.length);
                          if(title.length==1){
                            title=title[0].split("|");
                          }

                          if(title.length>1){

                              title[0]=title[0].trim();
                              var titolo=title[0].split("(");}
                              console.log("title[1]: "+title[1]);
*/
                              $.get("http://localhost:8000/GenreSimilarity?title="+title[1].trim(), function(data, status){
                                  var genere="";
                                  if(data.results.bindings.length>0){
                                      genere=data.results.bindings[0].genereNome.value;

                                      console.log(genere);

                                      $.get("http://localhost:8000/Artist?title="+title[1].trim(), function(data, status){
                                          if(data.results.bindings.length>0){
                                              for(var k=0; k<data.results.bindings.length; k++){
                                                  artist=data.results.bindings[k].artName.value;
                                                  console.log("artist:"+artist);
                                                  $.get("http://localhost:8000/Genre?genere="+genere+"&artist"+artist, function(data, status){

                                                          if(data.results.bindings[0].genereNome){
                                                              for(var j=0;j<recommender_size;j++){
                                                                  var songs="";
                                                                  var gen="";
                                                                  gen=data.results.bindings[0].genereNome.value;
                                                                  songs=data.results.bindings[j].songName.value;
                                                                  console.log("songs: ");
                                                                  console.log(songs);
                                                                  $.ajax({
                                                                      cache: false,
                                                                      data: {
                                                                        key:'AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ',
                                                                        q:songs,
                                                                        part:'id,snippet',
                                                                        maxResults:1},
                                                                        dataType:'json',
                                                                        type:'GET',
                                                                        url:'https://www.googleapis.com/youtube/v3/search'
                                                                      })

                                                                      .done(function(data) {
                                                                          console.log(data.items[0]);

                                                                          html += "<div  class='card border-info mb-3' style='width: 16rem;display: inline-block;'>";
                                                                          html+=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+data.items[0].id.videoId+"/default.jpg' value='"+data.items[0].id.videoId+"' alt='Card image cap'>";
                                                                          html += "<div class='card-body'> <p class='card-text'><b>"+ data.items[0].snippet.title +"</b><br>"+data.items[0].snippet.channelTitle+"<br>"+ (data.items[0].snippet.publishedAt).slice(0,-14)+"</br><br>"+gen+"</br></p></div></div> ";

                                                                          //console.log(html);
                                                                          $(".tabcontent#"+category).html(html);
                                                                        });
                                                                      }
                                                                    }
                                                                  });
                                                                }
                                                              }
                                                            });
                                                          }
                                    else {
                                        
                                        $('#GenreSimilarity').html('<h1>Sorry</h1><br><h3>Not found!</h3>');
                                     
                                      }
                                                        });
                                                      }
                                                    });
                                     $(".tabcontent#"+category).html(html);
          html="";
                                                  }
if (category=="BandSimilarity"){
    var html="";
    $.ajax({
        url: 'https://www.googleapis.com/youtube/v3/videos?key=' + 'AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ' + '&id=' + currentVideo + '&part=snippet',
                success: function(data){ currVid=data.items[0];},

                complete: function(){
                     var titolo;
                  titolo=cutTitle(currVid.snippet.title);
                  /*  title=currVid.snippet.title;
                    title=title.split("-");
                    //console.log(title);
                    if(title.length==1){
                      title=title[0].split("|");
                    }if(title.length>1){
                        artist=title[0].trim();
                        title[0]=title[0].trim();
                        var titolo=title[1].split("(");
                        console.log("titolo" + titolo[0]);
*/
                        $.get("http://localhost:8000/BandSimilarity?title="+titolo[0].trim(), function(data, status){

                            var band="";
                            if(data.results.bindings[0].bandName){
                                band=data.results.bindings[0].bandName.value;
                                console.log(data.results.bindings[0].bandName.value);
                                $.get("http://localhost:8000/GenreMembri?band="+band, function(data, status){
                                    var membri="";
                                    console.log(data.results.bindings.length);
                                    //  if(data.results.bindings[0]){
                                    var k=0;
                                    for(k=0 ; k<data.results.bindings.length ; k++){
                                        membri=data.results.bindings[k].memberName.value;
                                        console.log(membri);
                                        console.log(band);
                                        $.get("http://localhost:8000/Band?membriBand="+membri+"&band="+band, function(data, status){
                                            var songs="";
                                            var nomeBand="";
                                            console.log(data.results.bindings.length);

                                            if(data.results.bindings.length>0){
                                                for(var j=0;j<data.results.bindings.length;j++){

                                                    songs=data.results.bindings[j].songName.value;
                                                    nomeBand=data.results.bindings[j].bandName.value;
                                                    //console.log("songs: ");
                                                    console.log(songs);
                                                    $.ajax({
                                                        cache: false,
                                                        data: {
                                                          key:'AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ',
                                                          q:songs,
                                                          part:'id,snippet',
                                                          maxResults:1},
                                                          dataType:'json',
                                                          type:'GET',
                                                          url:'https://www.googleapis.com/youtube/v3/search'
                                                        })

                                                        .done(function(data) {
                                                          console.log(data.items[0]);

                                                          html += "<div  class='card border-info mb-3' style='width: 16rem;display: inline-block;'>";
                                                          html+=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+data.items[0].id.videoId+"/default.jpg' value='"+data.items[0].id.videoId+"' alt='Card image cap'>";
                                                          html += "<div class='card-body'> <p class='card-text'><b>"+ data.items[0].snippet.title +"</b><br>"+data.items[0].snippet.channelTitle+"<br>"+ (data.items[0].snippet.publishedAt).slice(0,-14)+"</br><br>"+membri+"</br><br>"+nomeBand+"</p></div></div> ";

                                                          //console.log(html);
                                                          $(".tabcontent#"+category).html(html);
                                                        });
                                                      }
                                                    }
                                                  });
                                                }
                                              });
                                            }
                              else {
                                        
                                        $('#BandSimilarity').html('<h1>Sorry</h1><br><h3>Not found!</h3>');
                                     
                                      }
                                          });
                                        }
                                      }
                                    });
                                  $(".tabcontent#"+category).html(html);
          html="";
                                  }
        }
        function makeid() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            text = possible.charAt(Math.floor(Math.random() * possible.length));
            return text;
        }
        function initHistory() {
          var queryString = window.location.search;//getUrlVars()["id"];
          var params = new URLSearchParams(queryString.substring(1));
          var id=params.get("id");
          if(id!=null){
            newClock();
            currentVideo=id;
          }else{
            id=currentVideo;
          }
          var stateObj = { id: id };
          history.replaceState(stateObj , currentVideo, "?id="+id);
          current_reason="undentified";
          caricaTab("Recent");
          
        }
        

        
         
        // inserita search luci

        $(document).ready(function(){   
          initHistory();
          $(window).on('popstate', function() {
            var id = history.state.id;
            historyBack(id);
          });
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

              url: "http://site1825.tw.cs.unibo.it/TW/globpop?"+"?id="+currentVideo,
              success: function(data) {
                Fvit=data;
                $('#Fvitali-button').click(caricaTab('Fvitali'));
              },
              error: function(data) {
                alert("Caricamento impossibile");
              }
            });    
          });    


      });
      function init(){
          gapi.client.setApiKey("AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ");
          gapi.client.load("youtube","v3",function(){ });
}
