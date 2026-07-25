// SAQEEL — real Mapbox GL JS basemap + real Saudi ADM1 boundaries (GADM via ArcGIS).
// Replaces the earlier D3/SVG rendering with an actual Mapbox vector-tile map;
// province polygons, markers, geofence and labels are drawn as real map layers
// / DOM overlays on top of it. No synthetic map data.
// Attributes (JSON where noted):
//   mode = "ops" | "geofence"
//   markers='[{lng,lat,band,label}]'  routes='[[[lng,lat],[lng,lat]]]'
//   regions='[{lng,lat,comp}]'  site='{lng,lat,label}'  radius-km  observed='{lng,lat}'
//   landmark='{lng,lat,ar,en}'
(function () {
  const MAPBOX_TOKEN = "pk.eyJ1IjoidmlrcmFtaW5kbGEiLCJhIjoiY21ybm9jeXhyMzhoejJ3c2RsaTl5amFpdiJ9.Zf8lWFbFJx7OdO07wbO3UA";
  const GL_JS = "https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js";
  const GL_CSS = "https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css";
  const STYLE = "mapbox://styles/mapbox/dark-v11";
  const ADM1_URL = "https://services7.arcgis.com/co15Y7Q02mBEZqnK/ArcGIS/rest/services/gadm41_SAU_shp/FeatureServer/1/query?where=1%3D1&outFields=NAME_1&returnGeometry=true&outSR=4326&f=geojson";
  const AR = {
    "Ar Riyad":"الرياض","Riyadh":"الرياض","Makkah":"مكة المكرمة","Ash Sharqiyah":"المنطقة الشرقية",
    "Eastern Province":"المنطقة الشرقية","Al Madinah":"المدينة المنورة","Al Quassim":"القصيم","Al Qassim":"القصيم",
    "'Asir":"عسير","Asir":"عسير","Tabuk":"تبوك","Ha'il":"حائل","Hail":"حائل","Jizan":"جازان","Jazan":"جازان",
    "Najran":"نجران","Al Bahah":"الباحة","Al Jawf":"الجوف","Northern Borders":"الحدود الشمالية","Al Hudud ash Shamaliyah":"الحدود الشمالية"
  };
  const BAND = { high:"#f0616a", medium:"#f0a838", low:"#37c98a", ok:"#37c98a" };
  const colorComp = c => c >= 90 ? "#37c98a" : c >= 80 ? "#f0a838" : "#f0616a";

  function loadCss(href){ if([...document.styleSheets].some(s=>s.href===href))return; const l=document.createElement("link"); l.rel="stylesheet"; l.href=href; document.head.appendChild(l); }
  function loadScript(src){ return new Promise((res,rej)=>{ if(window.mapboxgl){res();return;} if([...document.scripts].some(s=>s.src===src)){const t=setInterval(()=>{if(window.mapboxgl){clearInterval(t);res();}},30);return;} const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
  async function ensureGL(){ loadCss(GL_CSS); if(window.mapboxgl)return window.mapboxgl; await loadScript(GL_JS); window.mapboxgl.accessToken=MAPBOX_TOKEN; return window.mapboxgl; }
  let _adm1;
  async function ensureAdm1(){ if(_adm1!==undefined)return _adm1; try{const r=await fetch(ADM1_URL);_adm1=r.ok?await r.json():null;}catch(e){_adm1=null;} return _adm1; }

  function destPoint(lng,lat,bearingDeg,km){
    const R=6371, d=km/R, br=bearingDeg*Math.PI/180, la1=lat*Math.PI/180, lo1=lng*Math.PI/180;
    const la2=Math.asin(Math.sin(la1)*Math.cos(d)+Math.cos(la1)*Math.sin(d)*Math.cos(br));
    const lo2=lo1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(la1),Math.cos(d)-Math.sin(la1)*Math.sin(la2));
    return [lo2*180/Math.PI, la2*180/Math.PI];
  }
  function circlePolygon(lng,lat,km,steps){ steps=steps||64; const ring=[]; for(let i=0;i<=steps;i++) ring.push(destPoint(lng,lat,(i/steps)*360,km)); return { type:"Feature", geometry:{ type:"Polygon", coordinates:[ring] }, properties:{} }; }

  class KsaAdm1Map extends HTMLElement {
    static get observedAttributes(){ return ["mode","markers","routes","site","radius-km","regions","landmark","observed"]; }
    connectedCallback(){ this.style.display="block"; this.style.position=this.style.position||"relative"; this._markerEls=[]; this._render(); }
    disconnectedCallback(){ if(this._map){ this._map.remove(); this._map=null; } }
    attributeChangedCallback(){ if(this._map && this._map.isStyleLoaded()) this._applyData(); else if(this._readyPromise) this._readyPromise.then(()=>this._applyData()); }
    _json(a,d){ try{return JSON.parse(this.getAttribute(a)||d);}catch(e){return JSON.parse(d);} }

    async _render(){
      const mapboxgl=await ensureGL();
      this._geo=await ensureAdm1();
      const mode=this.getAttribute("mode")||"ops";
      const site0=this._json("site","null");

      const mapDiv=document.createElement("div");
      mapDiv.style.cssText="position:absolute; inset:0;";
      this.appendChild(mapDiv);
      const tip=document.createElement("div");
      tip.style.cssText="position:absolute; z-index:30; pointer-events:none; opacity:0; transition:opacity .12s; background:rgba(10,20,30,.94); border:1px solid rgba(150,205,235,.35); border-radius:8px; padding:8px 11px; font-family:var(--font-body); color:#eaf3fb; box-shadow:0 8px 24px rgba(0,0,0,.4); white-space:nowrap;";
      this.appendChild(tip);
      this._tip=tip;

      const center = mode==="geofence" && site0 ? [site0.lng,site0.lat] : [45,24];
      const zoom = mode==="geofence" ? 14 : 5.1;
      const map=new mapboxgl.Map({ container:mapDiv, style:STYLE, center, zoom, pitch:0, attributionControl:true, cooperativeGestures:false });
      this._map=map;
      map.addControl(new mapboxgl.NavigationControl({showCompass:false}),"top-left");
      map.scrollZoom.enable(); map.touchZoomRotate.enable(); map.touchZoomRotate.disableRotation();

      this._readyPromise = new Promise(res=>{
        map.on("load",()=>{ this._setupLayers(); this._applyData(); res(); });
      });

      const zoomHint=document.createElement("div");
      zoomHint.style.cssText="position:absolute; bottom:10px; inset-inline-end:10px; z-index:5; font:600 10px var(--font-body); color:rgba(224,238,248,.6); background:rgba(10,20,30,.55); padding:4px 8px; border-radius:6px; pointer-events:none;";
      zoomHint.textContent="Pinch or scroll to zoom";
      this.appendChild(zoomHint);
    }

    _setupLayers(){
      const map=this._map, geo=this._geo;
      if(geo && geo.features && geo.features.length){
        map.addSource("adm1",{ type:"geojson", data:geo });
        map.addLayer({ id:"adm1-fill", type:"fill", source:"adm1", paint:{ "fill-color": ["coalesce",["get","__color"],"#1c4a5e"], "fill-opacity": ["coalesce",["get","__op"],0.55] } });
        map.addLayer({ id:"adm1-line", type:"line", source:"adm1", paint:{ "line-color":"rgba(150,205,235,.55)", "line-width":1 } });
        map.addLayer({ id:"adm1-line-hover", type:"line", source:"adm1", filter:["==",["get","NAME_1"],"__none__"], paint:{ "line-color":"#eaf3fb", "line-width":2 } });

        map.on("mousemove","adm1-fill",(e)=>{
          if(!e.features.length) return;
          const f=e.features[0];
          map.setFilter("adm1-line-hover",["==",["get","NAME_1"],f.properties.NAME_1]);
          const nm=f.properties.NAME_1||""; const ar=AR[nm]||nm; const comp=f.properties.__comp;
          this._tip.innerHTML = `<div style="font-size:13px;font-weight:700;">${ar}</div><div style="font-size:10px;color:rgba(170,205,230,.75);letter-spacing:.5px;margin-top:1px;">${nm.toUpperCase()}</div>`+(comp!=null?`<div style="margin-top:5px;font-size:11.5px;color:${colorComp(comp)};font-weight:700;">امتثال ${comp}%</div>`:"");
          this._tip.style.opacity=1;
          const r=this.getBoundingClientRect(); let x=e.originalEvent.clientX-r.left+14, y=e.originalEvent.clientY-r.top-10; if(x+150>r.width) x=e.originalEvent.clientX-r.left-150;
          this._tip.style.left=x+"px"; this._tip.style.top=y+"px";
          map.getCanvas().style.cursor="pointer";
        });
        map.on("mouseleave","adm1-fill",()=>{ map.setFilter("adm1-line-hover",["==",["get","NAME_1"],"__none__"]); this._tip.style.opacity=0; map.getCanvas().style.cursor=""; });
      }
      map.addSource("geofence",{ type:"geojson", data:{ type:"FeatureCollection", features:[] } });
      map.addLayer({ id:"geofence-fill", type:"fill", source:"geofence", paint:{ "fill-color":"#37c98a", "fill-opacity":.15 } });
      map.addLayer({ id:"geofence-line", type:"line", source:"geofence", paint:{ "line-color":"#37c98a", "line-width":1.5, "line-dasharray":[2,2] } });
      map.addSource("routes",{ type:"geojson", data:{ type:"FeatureCollection", features:[] } });
      map.addLayer({ id:"routes-line", type:"line", source:"routes", paint:{ "line-color":"#6fb7e0", "line-width":1.6, "line-opacity":.85, "line-dasharray":[1,2] } });
    }

    _clearMarkers(){ this._markerEls.forEach(m=>m.remove()); this._markerEls=[]; }

    _applyData(){
      const map=this._map; if(!map) return;
      const mode=this.getAttribute("mode")||"ops";
      const regions=this._json("regions","[]");
      const nearComp=(lng,lat)=>{ if(!regions.length)return null; let b=regions[0],bd=Infinity; regions.forEach(r=>{const d=(r.lng-lng)**2+(r.lat-lat)**2; if(d<bd){bd=d;b=r;}}); return b.comp; };

      if(map.getSource("adm1") && this._geo){
        const feats = this._geo.features.map(f=>{ const c=f.properties.__centroid || this._centroid(f); const comp = regions.length ? nearComp(c[0],c[1]) : null;
          return { ...f, properties: { ...f.properties, __comp: comp, __color: comp!=null?colorComp(comp):"#1c4a5e", __op: comp!=null?0.75:0.35, __centroid: c } }; });
        map.getSource("adm1").setData({ type:"FeatureCollection", features: feats });
        if(mode!=="geofence" && !map.getLayer("adm1-fill-hidden")){} // provinces always visible in ops mode
      }
      if(map.getLayer("adm1-fill")) map.setLayoutProperty("adm1-fill","visibility", mode==="geofence"?"none":"visible");
      if(map.getLayer("adm1-line")) map.setLayoutProperty("adm1-line","visibility", mode==="geofence"?"none":"visible");

      this._clearMarkers();
      this._json("markers","[]").forEach(m=>{
        const col=BAND[m.band]||"#37c98a";
        const el=document.createElement("div");
        el.style.cssText="display:flex; align-items:center; gap:6px; cursor:pointer;";
        el.innerHTML = `<span style="position:relative; width:11px; height:11px;"><span style="position:absolute; inset:0; border-radius:50%; background:${col}; opacity:.5; animation:ksaPulse 2.8s infinite;"></span><span style="position:absolute; inset:2px; border-radius:50%; background:${col}; border:1.2px solid #0a1622;"></span></span>`+(m.label?`<span style="font-size:11px; font-weight:600; font-family:var(--font-body); color:#eaf3fb; text-shadow:0 0 3px rgba(8,20,30,.9), 0 0 3px rgba(8,20,30,.9);">${m.label}</span>`:"");
        const mk=new window.mapboxgl.Marker({element:el, anchor:"left"}).setLngLat([m.lng,m.lat]).addTo(map);
        this._markerEls.push(mk);
      });

      const lm=this._json("landmark","null");
      if(lm){
        const el=document.createElement("div");
        el.style.cssText="display:flex; align-items:center; gap:8px;";
        el.innerHTML = `<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="9" fill="#f4c542" opacity=".18"/><path d="M10,2 L11.7,8 L18,10 L11.7,12 L10,18 L8.3,12 L2,10 L8.3,8 Z" fill="#f4c542" stroke="#0a1622" stroke-width="0.6"/></svg>`+
          `<span style="font-family:var(--font-body); text-shadow:0 0 3px rgba(8,20,30,.9);"><span style="display:block; font-size:11.5px; font-weight:700; color:#ffe9a8;">${lm.ar||""}</span><span style="display:block; font-size:8.5px; font-weight:600; letter-spacing:.6px; color:rgba(244,197,66,.85);">${lm.en||""}</span></span>`;
        const mk=new window.mapboxgl.Marker({element:el, anchor:"left"}).setLngLat([lm.lng,lm.lat]).addTo(map);
        this._markerEls.push(mk);
      }

      const site=this._json("site","null");
      const radiusKm=parseFloat(this.getAttribute("radius-km")||"1.5");
      if(site && map.getSource("geofence")){
        map.getSource("geofence").setData(circlePolygon(site.lng,site.lat,radiusKm));
        const el=document.createElement("div");
        el.style.cssText=`width:16px; height:16px; border-radius:50%; background:var(--action-primary,#2f7ed8); border:2.5px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,.4);`;
        const mk=new window.mapboxgl.Marker({element:el}).setLngLat([site.lng,site.lat]).addTo(map);
        this._markerEls.push(mk);
        map.jumpTo({ center:[site.lng,site.lat], zoom:14 });
      } else if(map.getSource("geofence")){
        map.getSource("geofence").setData({ type:"FeatureCollection", features:[] });
      }
      const obs=this._json("observed","null");
      if(obs){ const el=document.createElement("div"); el.style.cssText="width:11px;height:11px;border-radius:50%;background:#f0a838;border:1.5px solid #0a1018;"; const mk=new window.mapboxgl.Marker({element:el}).setLngLat([obs.lng,obs.lat]).addTo(map); this._markerEls.push(mk); }

      if(map.getSource("routes")){
        const rt=this._json("routes","[]").map(r=>({ type:"Feature", geometry:{ type:"LineString", coordinates:r }, properties:{} }));
        map.getSource("routes").setData({ type:"FeatureCollection", features:rt });
      }
      if(!this._geo && mode==="geofence" && !this._noGeoNoted){
        this._noGeoNoted=true;
        const note=document.createElement("div");
        note.style.cssText="position:absolute; bottom:10px; inset-inline-start:12px; z-index:5; font:11px var(--font-body); color:#9fb2c4; background:rgba(10,20,30,.55); padding:3px 8px; border-radius:6px;";
        note.textContent="Boundary service unavailable — position shown, no boundary drawn";
        this.appendChild(note);
      }
    }

    _centroid(f){
      let coords = f.geometry.type==="Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates.reduce((a,p)=>a.concat(p[0]),[]);
      let x=0,y=0; coords.forEach(c=>{x+=c[0];y+=c[1];}); return [x/coords.length, y/coords.length];
    }
  }
  if(!document.getElementById("ksa-adm1-map-style")){
    const st=document.createElement("style"); st.id="ksa-adm1-map-style";
    st.textContent="@keyframes ksaPulse{0%{transform:scale(1);opacity:.5}70%{transform:scale(2.4);opacity:0}100%{opacity:0}}";
    document.head.appendChild(st);
  }
  if(!customElements.get("ksa-adm1-map")) customElements.define("ksa-adm1-map",KsaAdm1Map);
})();
