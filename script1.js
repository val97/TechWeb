  var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
 
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

     

      
      
      //inizializzazione player
      var player;
      var onYouTubeIframeAPIReady =      function onYouTubeIframeAPIReady() {
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
      //prende titolo e nome dell'artista
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
      html+=" <div class='media border p-3 '>";
      html +=  "<img src="+JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorProfileImageUrl)+" alt="+JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorProfileImageUrl)+" class='mr-3 mt-3 rounded-circle' style='width:65px;height:65px'>";
      html+=  "<div class='media-body'>";
      html +="<h5>"+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorDisplayName).slice(1,-1)+"<small><i>   Posted on  "+JSON.stringify(response.items[i].snippet.topLevelComment.snippet.publishedAt).slice(1,-15)+"</i></small></h5>";
      html+="<p>"+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.textOriginal).slice(1,-1)+"</p></div></div>";

      //<small><i>Posted on February 19, 2016</i></small>
      //  html+="<img width='28' heigth='28' src="+JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorProfileImageUrl)+"> <b> "+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.authorDisplayName).slice(1,-1) +" </b> <br> "+ JSON.stringify(response.items[i].snippet.topLevelComment.snippet.textOriginal)+"<hr>";
      $('#comment_container').html(html +"<br>");
        }
          });
     //DESCRIZIONE E TITOLO
     var request1 = gapi.client.youtube.videos.list({
         'method': 'get',
         'path': '/youtube/v3/videos',
         'id': q,
         'part': 'snippet'  });
          request1.execute(function(response){
            var title="";
            var desc="";
            title +="<b><h2>"+response.items[0].snippet.title+"</h2></b>";
            desc += "<p>"+JSON.stringify(response.items[0].snippet.description)+"</p>";
            desc.replace("\n","<br>");
           // title.replace('" ', " ");
            $('#description_container').html(desc +"<br>");
            $('#title_container').html(title);
          });
        
       }
        if(event.data == YT.PlayerState.PAUSED)
          stopClock();
      }
      



      //viene riempita la lista delle canzoni iniziali
      function loadCatalog(data){
          for (var i = 0; i < data.length; i++) {
                
                $("#catalogo").append("<button data-dismiss='modal'  onclick='caricavideo("+JSON.stringify(data[i].videoID)+")'>"+"<div  class='card border-info mb-3' style='border:1px;width: 11rem;height: 7rem; display: inline-block; '><img class='card-img-top' src ='https://img.youtube.com/vi/"+(JSON.stringify(data[i].videoID)).slice(1,-1)+"/default.jpg' value='"+ data[i].videoID +"' alt='Card image cap'><div class='card-body'  style=' overflow: hidden; text-overflow=ellipsis'> <p class='card-text' ><b>"+ data[i].title +"</b><br>"+data[i].category+"<br>"+data[i].artist+"</p></div></div>");
            /* main += "<div  class='card border-info mb-3' style='width: 16rem;height: 20rem; display: inline-block;'>";
            main +=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+(JSON.stringify(data[i].videoID)).slice(1,-1)+"/default.jpg' value='"+JSON.stringify(data[i].videoID)+"' alt='Card image cap'>";
             main += "<div class='card-body'> <p class='card-text'><b>"+ data[i].title +"</b><br>"+data[i].category+"<br>"+ data[i].artist+"</p></div></div> ";
         */ }

         // $(".container-fluid").html(main);
}

        function caricavideo(data){
            newClock();
            lastVideo=currentVideo;
            currentVideo=data;
            document.getElementById("lista").click();
            player.loadVideoById(data, 0, "large");  //"0" secondi di inizio del video
            current_reason=last_reason;
             $('#wiki_container').html(" ");
            $('#artist_container').html(" ");
           $('#info_container').html(" ");
            var stateObj = {id:data};
            history.pushState(stateObj , data, "?id="+data);
            caricaTab("Recent");

           
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
       function stampa(v, dim,category,info){
         var vid=v;
         var html="";
  console.log(vid);
          for (var i = 0; i < dim; i++) {
        if(vid[i]!= "undefined"){
        if(info){
                html += "<div  class='card border-info mb-3' style='width: 16rem; border:none; display: inline-block; padding:1%; padding-top:3%'>";
                html+=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+vid[i].id.videoId+"/default.jpg' value='"+vid[i].id.videoId+"' alt='Card image cap'>";
                html += "<div class='card-body'style=' overflow: hidden' > <p class='card-text'><b>"+ vid[i].snippet.title +"</b><br>"+vid[i].snippet.channelTitle+"<br>"+ (vid[i].snippet.publishedAt).slice(0,-14)+"</p></div></div> ";
      } else{
                html += "<div  class='card border-info mb-3' style='width: 16rem; border:none; display: inline-block; padding:1%; padding-top:3%''>";
                html+=" <img class='card-img-top'  src ='https://img.youtube.com/vi/"+vid[i].id+"/default.jpg' value='"+vid[i].id+"' alt='Card image cap'>";
		html += "<div class='card-body' style=' overflow: hidden';> <p class='card-text'><b>"+ vid[i].snippet.title +"</b><br>" +vid[i].snippet.channelTitle+"<br>"+ (vid[i].snippet.publishedAt).slice(0,-14)+"</p></div></div> ";
              }
            }
          }
          $(".tabcontent#"+category).html(html);

          $('img').click(function(){
                caricavideo($(this).attr("value"));
          });
        }
       function takeInfoById(vid,dim,category,info,j){
              $.ajax({
                           url: 'https://www.googleapis.com/youtube/v3/videos?key=' + 'AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ' + '&id=' + vid[j] + '&part=snippet',
                           success: function(data){
                              vid[j]=data.items[0];
                              j++;
                           } ,
                           complete: function(){
                              if((j<20)&&(j<dim))
                                takeInfoById(vid,dim,category,info,j);
                              else    //if(j==20)
                                stampa(vid,dim,category,info);
                           }
                        });
              }
        

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
            vid=[];
            var info=true;

         
            if(category=="Recent"){
              info=false;
              //dove è caricarecent???????? in popscript!
              dim=caricarecent(vid);
              var j=0;
              takeInfoById(vid,dim,category,info,j);
                   
              }
            if((category=="popLocAss")||(category=="popLocRel")||(category=="popGlobAss")||(category=="popGlobRel")){
              info=false
        var prom=caricaPopularity(category,vid);
              prom.then(function(d){
        dim=d;
                var j=0;
                takeInfoById(vid,dim,category,info,j);
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
                      vid.push(resSearch.items[i]);
                  }
                  stampa(vid,dim,category,info);
              }
            }
            //ho tolto -fvitali dal document ready e l'ho messo tutto su
            if(category=="Fvitali"){
              getFvitali(vid,dim,info,category);
               
          }
              

           
            if (category=="Random") {
                 getRandom(vid,dim,info,category);
            }
         
          if(category =="Related"){
            getRelated(vid,dim,info,category);
              
            }

  if(category== "ArtistSimilarity"){
    getArtistSimilarity(category);
      }

   if(category== "GenreSimilarity"){
      getGenreSimilarity(category);
     
   }
                
              
                                                       
                        
if (category=="BandSimilarity"){
  getBandSimilarity(category);
  
                                  }


          
/*            if((category!="popLocAss")&&(category!="popLocRel")&&(category!="Random")&&(category!="popGlobAss")&&(category!="popGlobRel")&&(category!="ArtistSimilarity") &&(category!="GenreSimilarity") &&(category!="BandSimilarity"))
    stampa(vid,dim,category,info);*/
        }
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}
        function initHistory() {
          /*var queryString = window.location.search;//getUrlVars()["id"];
          var params = new URLSearchParams(queryString.substring(1));
          var id=params.get("id");*/
          var id=getQueryVariable("id");
          if(id!=null){
            var stateObj = { id: id };
            history.replaceState(stateObj , currentVideo, "?id="+id);
            newClock();
            currentVideo=id;
            current_reason="undentified";
            caricaTab("Recent");
          }
        }
        
        $(document).ready(function(){
          initHistory();
  console.log("ready");
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

         
      });
      function init(){
          gapi.client.setApiKey("AIzaSyCmxhjyAdTBxuEOG_etapCgLYwIBpSmdbQ");
          gapi.client.load("youtube","v3",function(){ });
      }
