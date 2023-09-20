import React, { useState } from 'react';
import DeckGL from '@deck.gl/react';
import { LineLayer, PathLayer, COORDINATE_SYSTEM, OrbitView, BitmapLayer, SimpleMeshLayer } from 'deck.gl';
import {
  Container, connectToHarmowareVis, LoadingIcon, FpsDisplay
} from 'harmoware-vis';
import Controller from '../components';
import {registerLoaders} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

registerLoaders([OBJLoader]);

//const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN; //Acquire Mapbox accesstoken
//const titleimg = '../../data/title.png';
//const titleimg2 = '../../data/title2.png';
//const imglist = [{src:titleimg2},{src:titleimg2},{src:titleimg2},{src:titleimg2},{src:titleimg2}]

const obj_1F = 'data/p_tokai_1F_joined.obj';

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 45,
  rotationOrbit: 0,
  zoom: 3.0
};

const App = (props)=>{
  const [now, setNow] = React.useState(new Date())
  const [imgdispMode, setImgdispMode] = React.useState(true)
  const [dispStart, setDispStart] = React.useState(false)
  const [dispStart2, setDispStart2] = React.useState(false)
  const [imglist, setImgList] = React.useState([])
  const [layerlist, setLayerList] = React.useState([])
  const [srclist, setSrcList] = React.useState([])
  const [opacity, setOpacity] = React.useState(0.5)

  const [state,setState] = useState({ popup: [0, 0, ''] })
  const [viewState, updateViewState] = useState(INITIAL_VIEW_STATE);
  const [imgRef, setImgRef] = useState([])
  const [canvasRef, setCanvasRef] = useState([])
  const [bounds, setBounds] = useState([])
  const [context, setContext] = useState([])
  const [imgSize, setImgSize] = useState([])
  const [imgDispSize, setImgDispSize] = useState([])
  const [trimSize, setTrimSize] = useState([])
  const [imgId, setImgId] = useState(null)
  const [imgIdIdx,setImgIdIdx] = useState(-1)
  const [update, setUpdate] = useState([])
  const [size3d, setSize3d] = useState([])
  const [deg3d, setDeg3d] = useState([])
  const [pos3d, setPos3d] = useState([])
  const [aspect, setAspect] = useState([])
  const [z_order, setzOrder] = useState([])
  const [imgLock, setImgLock] = useState([])
  const [imgOpacity, setImgOpacity] = React.useState([])

  const { actions, viewport, loading } = props;

  React.useEffect(()=>{
    setTimeout(()=>{InitialFileRead({setImgList})},1000)
  },[])

  React.useEffect(function() {
    const intervalId = setInterval(function() {
      setNow(new Date());
    }, 100);
    return function(){clearInterval(intervalId)};
  }, [now]);

  React.useEffect(()=>{
    if(imgId !== null && imgId.includes('BitmapLayer')){
      const value = parseFloat(imgId.match(/[0-9.]+/g)[0])
      setImgIdIdx(value|0)
    }else{
      setImgIdIdx(-1)
    }
  },[imgId])

  const getBounds = (size,deg,pos,imgSize,trimSize)=>{
    const {width:img_width,height:img_height} = imgSize
    const {x:trim_x,y:trim_y,width:trim_width,height:trim_height} = trimSize
    const trimpos = [
      {x:trim_x-(img_width/2),y:(img_height/2)-(trim_y+trim_height)},
      {x:trim_x-(img_width/2),y:(img_height/2)-trim_y},
      {x:(trim_x+trim_width)-(img_width/2),y:(img_height/2)-trim_y},
      {x:(trim_x+trim_width)-(img_width/2),y:(img_height/2)-(trim_y+trim_height)}
    ]
    const trimadeg = trimpos.map((e)=>Math.atan2(e.y,e.x)*180/Math.PI)
    const rate = size/img_width
    const radius = trimpos.map((e,i)=>((e.x*rate)/Math.cos(trimadeg[i]*(Math.PI/180))))
    const rotate_x = trimadeg.map((e,i)=>[radius[i]*Math.cos((deg.z+e)*(Math.PI/180)),radius[i]*Math.sin((deg.z+e)*(Math.PI/180)),0])
    const rotate_y = rotate_x.map((e)=>{
      return [e[0],e[1]*Math.cos((deg.x)*(Math.PI/180)),e[1]*Math.sin((deg.x)*(Math.PI/180))]
    })
    const r2 = rotate_y.map((e)=>Math.sqrt((e[0]**2)+(e[2]**2)))
    const deg2 = rotate_y.map((e)=>Math.atan2(e[0],e[2])*180/Math.PI)
    const rotate_z = rotate_y.map((e,i)=>{
      return [r2[i]*Math.sin((deg.y+deg2[i])*(Math.PI/180)),e[1],r2[i]*Math.cos((deg.y+deg2[i])*(Math.PI/180))]
    })
    return rotate_z.map((e)=>[e[0]+pos.x,e[1]+pos.y,e[2]+pos.z])
  }

  const initProc = ()=>{
    const worksrclist = []
    const workcanvasRef = []
    const workImgSize = []
    const workTrimmSize = []
    const workupdate = []
    const worksize3d = []
    const workdeg3d = []
    const workpos3d = []
    const workaspect = []
    const workzOrder = []
    const workimgLock = []
    const workimgOpacity = []
    for(let i=0; i<imglist.length; i=i+1){
      const img = imglist[i]
      const shift = i%10
      worksrclist.push(img.src)
      workImgSize.push({width:0,height:0})
      workTrimmSize.push(img.trim !== undefined ? img.trim : {x:0,y:0,width:0,height:0})
      workcanvasRef.push(undefined)
      workupdate.push(0)
      worksize3d.push(img.size !== undefined ? img.size : 20)
      workdeg3d.push(img.deg !== undefined ? img.deg : {x:0, y:0, z:0})
      workpos3d.push(img.pos !== undefined ? img.pos : {x:(shift*10-50), y:(shift*10-50), z:i*2})
      workaspect.push([0,0,0,0])
      workzOrder.push(100)
      workimgLock.push(false)
      workimgOpacity.push(1)
    }
    setSrcList(worksrclist)
    setCanvasRef(workcanvasRef)
    setImgSize(workImgSize)
    setImgDispSize(workImgSize)
    setTrimSize(workTrimmSize)
    setUpdate(workupdate)
    setSize3d(worksize3d)
    setDeg3d(workdeg3d)
    setPos3d(workpos3d)
    setAspect(workaspect)
    setzOrder(workzOrder)
    setImgLock(workimgLock)
    setImgOpacity(workimgOpacity)
    setImgId(null)
    setImgIdIdx(-1)
  }

  React.useEffect(()=>{
    actions.setInitialViewChange(false);
    actions.setSecPerHour(3600);
    actions.setLeading(0);
    actions.setTrailing(0);
    actions.setAnimatePause(true);
    initProc()
  },[])

  React.useEffect(()=>{
    initProc()
    if(App.timeoutID){
      clearTimeout(App.timeoutID)
      App.timeoutID = undefined
    }
    if(imglist.length > 0){
      App.timeoutID = setTimeout(()=>{setDispStart(true)},100000);
    }else{
      setDispStart(false)
    }
  },[imglist])

  React.useEffect(()=>{
    if(App.timeoutID2){
      clearTimeout(App.timeoutID2)
      App.timeoutID2 = undefined
    }
    if(dispStart){
      App.timeoutID2 = setTimeout(()=>{setDispStart2(true)},1000);
      setTimeout(()=>{layerUpdate(update)},5000);
    }else{
      setDispStart2(false)
    }
  },[dispStart])

  const layerUpdate = (update)=>{
    const wkupdate = [...update]
    const length = update.length
    for(let i=0; i<length; i=i+1){
      wkupdate[i] = update[i]?0:1
    }
    setUpdate(wkupdate)
  }

  React.useEffect(()=>{
    const wklayerlist = imglist.map((e,i)=>({idx:i,z_order:z_order[i]}))
    wklayerlist.sort((a, b) => (a.z_order - b.z_order))
    setLayerList(wklayerlist)
  },[imglist,z_order])

  React.useEffect(()=>{
    if(imgIdIdx === -1){
      const workBounds = []
      const wkupdate = [...update]
      const length = Math.min(size3d.length,deg3d.length,pos3d.length,trimSize.length,update.length)
      for(let i=0; i<length; i=i+1){
        workBounds[i] = getBounds(size3d[i],deg3d[i],pos3d[i],imgSize[i],trimSize[i])
        wkupdate[i] = update[i]?0:1
      }
      setBounds(workBounds)
      setUpdate(wkupdate)
    }else{
      const workBounds = [...bounds]
      workBounds[imgIdIdx] = getBounds(size3d[imgIdIdx],deg3d[imgIdIdx],pos3d[imgIdIdx],imgSize[imgIdIdx],trimSize[imgIdIdx])
      setBounds(workBounds)
      const wkupdate = [...update]
      wkupdate[imgIdIdx] = update[imgIdIdx]?0:1
      setUpdate(wkupdate)
    }
  },[dispStart,imgIdIdx,size3d,deg3d,pos3d,imgSize,trimSize])

  React.useEffect(()=>{
    if(imgDispSize.length === 0){
      return
    }
    if(imgDispSize.every((el)=>el.width>0 && el.height>0)){
      if(App.timeoutID){
        clearTimeout(App.timeoutID)
        App.timeoutID = undefined
      }
      if(!dispStart){
        setDispStart(true)
      }
      return
    }
    const wkImgRef = document.getElementsByClassName('img_handler')
    const workImgSize = []
    const workImgDispSize = []
    const workTrimmSize = []
    const workaspect = []
    const workzOrder = []
    const workimgLock = []
    const workimgOpacity = []
    for(let i=0; i<wkImgRef.length; i=i+1){
      workImgSize.push({width:wkImgRef[i].naturalWidth,height:wkImgRef[i].naturalHeight})
      const deg = Math.atan2(wkImgRef[i].naturalHeight,wkImgRef[i].naturalWidth)*180/Math.PI
      workaspect.push([180+deg,180-deg,deg,360-deg])
      workImgDispSize.push({width:wkImgRef[i].clientWidth,height:wkImgRef[i].clientHeight})
      workTrimmSize.push({x:0,y:0,width:wkImgRef[i].naturalWidth,height:wkImgRef[i].naturalHeight})
      workzOrder.push(100)
      workimgLock.push(false)
      workimgOpacity.push(1)
    }
    setImgRef(wkImgRef)
    setImgSize(workImgSize)
    setImgDispSize(workImgDispSize)
    for(let i=0; i<imglist.length; i=i+1){
      if(imglist[i].trim !== undefined){
        workTrimmSize[i] = imglist[i].trim
        const deg = Math.atan2(imglist[i].trim.height,imglist[i].trim.width)*180/Math.PI
        workaspect[i] = [180+deg,180-deg,deg,360-deg]
      }
      if(imglist[i].z_order !== undefined){
        workzOrder[i] = imglist[i].z_order
      }
      if(imglist[i].imgLock !== undefined){
        workimgLock[i] = imglist[i].imgLock
      }
      if(imglist[i].imgOpacity !== undefined){
        workimgOpacity[i] = imglist[i].imgOpacity
      }
    }
    setAspect(workaspect)
    setzOrder(workzOrder)
    setImgLock(workimgLock)
    setImgOpacity(workimgOpacity)
    setTrimSize(workTrimmSize)
  },[now,imglist])

  React.useEffect(()=>{
    const workCanvasRef = document.getElementsByClassName('canvas_handler')
    const workContext = []
    for(let i=0; i<workCanvasRef.length; i=i+1){
      if(workContext[i] === undefined){
        workContext[i] = workCanvasRef[i].getContext('2d');
      }
    }
    setContext(workContext)
    setCanvasRef(workCanvasRef)
  },[now,imglist])

  React.useEffect(()=>{
    if(dispStart && imgRef.length > 0 && canvasRef.length > 0 && imgRef.length === canvasRef.length){
      if(imgIdIdx === -1){
        for(let i=0; i<context.length; i=i+1){
          const {width:dspwidth,height:dspheight} = imgDispSize[i] !== undefined ? imgDispSize[i] : {width:0,height:0}
          const {x,y,width:trimwidth,height:trimheight} = trimSize[i]
          context[i].clearRect(0,0,dspwidth,dspheight)
          if(imgdispMode){
            context[i].drawImage(imgRef[i], x, y, trimwidth, trimheight, 0, 0, trimwidth, trimheight)
          }else{
            context[i].fillStyle = imgLock[i]?"green":"blue";
            context[i].fillRect(0, 0, trimwidth, trimheight)
            context[i].strokeStyle = "white"
            context[i].lineWidth = 5
            context[i].strokeRect(0, 0, trimwidth, trimheight)
            context[i].fillStyle = "white"
            context[i].font = "80px monospace"
            context[i].fillText(imglist[i].src,100,150,trimwidth-200)
            context[i].fillText(`z_order:${z_order[i]}`,100,250,trimwidth-200)
            context[i].fillText(`size:${size3d[i]}`,100,350,trimwidth-200)
            const top = trimSize[i].y
            const bottom = imgSize[i].height-trimSize[i].y-trimSize[i].height
            const left = trimSize[i].x
            const right = imgSize[i].width-trimSize[i].x-trimSize[i].width
            context[i].fillText(`trim:[${top},${bottom},${left},${right}]`,100,450,trimwidth-200)
          }
        }
      }else{
        const {width:dspwidth,height:dspheight} = imgDispSize[imgIdIdx] !== undefined ? imgDispSize[imgIdIdx] : {width:0,height:0}
        const {x,y,width:trimwidth,height:trimheight} = trimSize[imgIdIdx]
        context[imgIdIdx].clearRect(0,0,dspwidth,dspheight)
        if(imgdispMode){
          context[imgIdIdx].drawImage(imgRef[imgIdIdx], x, y, trimwidth, trimheight, 0, 0, trimwidth, trimheight)
        }else{
          context[imgIdIdx].fillStyle = imgLock[imgIdIdx]?"green":"blue";
          context[imgIdIdx].fillRect(0, 0, trimwidth, trimheight)
          context[imgIdIdx].strokeStyle = "white"
          context[imgIdIdx].lineWidth = 5
          context[imgIdIdx].strokeRect(0, 0, trimwidth, trimheight)
          context[imgIdIdx].fillStyle = "white"
          context[imgIdIdx].font = "80px monospace"
          context[imgIdIdx].fillText(imglist[imgIdIdx].src,100,150,trimwidth-200)
          context[imgIdIdx].fillText(`z_order:${z_order[imgIdIdx]}`,100,250,trimwidth-200)
          context[imgIdIdx].fillText(`size:${size3d[imgIdIdx]}`,100,350,trimwidth-200)
          const top = trimSize[imgIdIdx].y
          const bottom = imgSize[imgIdIdx].height-trimSize[imgIdIdx].y-trimSize[imgIdIdx].height
          const left = trimSize[imgIdIdx].x
          const right = imgSize[imgIdIdx].width-trimSize[imgIdIdx].x-trimSize[imgIdIdx].width
          context[imgIdIdx].fillText(`trim:[${top},${bottom},${left},${right}]`,100,450,trimwidth-200)
      }
      }
    }
  },[dispStart,dispStart2,imgDispSize,trimSize,imgdispMode,imgIdIdx,imgLock])

  React.useEffect(()=>{
    window.onkeydown = (e)=>{
      if(e.isTrusted === true && e.altKey === false && e.code === "KeyH" && e.ctrlKey === false &&
        e.key === "h" && e.keyCode === 72 && e.repeat === false && e.shiftKey === false && e.type === "keydown"){
        App.panel = !App.panel
      }
    }
  },[])

  const updateState = (updateData)=>{
    setState({...state, ...updateData})
  }

  const getPathLayers = ()=>{
    if(imgIdIdx < 0){
      return null
    }
    return new PathLayer({
      id: `PathLayer-${imgIdIdx}}`,
      data: [[bounds[imgIdIdx][0],bounds[imgIdIdx][1],bounds[imgIdIdx][2],bounds[imgIdIdx][3],bounds[imgIdIdx][0]]],
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getPath: (x) => x,
      getColor: ()=>[0,255,0,255],
      getWidth: ()=>0.1,
    })
  }

  const getLayers = ()=>{
    if(dispStart2){
      return layerlist.map((e)=>{
        return new BitmapLayer({
          id: `BitmapLayer-${e.idx}-${update[e.idx]}-${imgdispMode}`,
          image: canvasRef[e.idx],
          bounds: bounds[e.idx],
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          pickable: true,
          onClick,
          opacity: imgdispMode?imgOpacity[e.idx]:0.5,
        })
      })
    }
    return null
  }

  const getImgCanvas = ()=>{
    return imglist.map((element,idx)=>{
      const {width,height} = imgSize[idx] !== undefined ? imgSize[idx] : {width:0,height:0}
      const {width:dspwidth,height:dspheight} = imgDispSize[idx] !== undefined ? imgDispSize[idx] : {width:0,height:0}
      const {x,y,width:trimwidth,height:trimheight} = trimSize[idx] !== undefined ? trimSize[idx] : {x:0,y:0,width:0,height:0}
      return(<div key={idx}>
        <img draggable={false} className='img_handler' src={element.src} width={`${width?width:dspwidth}px`} height={`${height?height:dspheight}px`}/>
        <canvas className='canvas_handler' width={`${trimwidth}px`} height={`${trimheight}px`} ></canvas>
      </div>)
    })
  }

  const onClick = (el)=>{
    if (el && el.layer) {
      //console.log(`el:${el}`)
      console.log({el})
      setImgId(el.layer.id)
    }
  }

  const getOutputData = ()=>{
    return imglist.map((el,idx)=>{
      const data = {src: el.src}
      data.trim = trimSize[idx]
      if(size3d[idx] !== 20){
        data.size = size3d[idx]
      }
      if(deg3d[idx].x !== 0 || deg3d[idx].y !== 0 || deg3d[idx].z !== 0){
        data.deg = deg3d[idx]
      }
      data.pos = pos3d[idx]
      if(z_order[idx] !== 100){
        data.z_order = z_order[idx]
      }
      if(imgLock[idx] === true){
        data.imgLock = imgLock[idx]
      }
      if(imgOpacity[idx] !== 1){
        data.imgOpacity = imgOpacity[idx]
      }
      return data
    })
  }

  return (
    <Container {...props}>
      <Controller {...props} updateViewState={updateViewState} viewState={viewState} setImgList={setImgList}
        imgId={imgId} setImgId={setImgId} imgIdIdx={imgIdIdx} setImgIdIdx={setImgIdIdx} imgSize={imgSize}
        size3d={size3d} setSize3d={setSize3d} deg3d={deg3d} setDeg3d={setDeg3d} pos3d={pos3d} setPos3d={setPos3d}
        trimSize={trimSize} setTrimSize={setTrimSize} update={update} setUpdate={setUpdate}
        srclist={srclist} getOutputData={getOutputData} aspect={aspect} setAspect={setAspect}
        z_order={z_order} setzOrder={setzOrder} opacity={opacity} setOpacity={setOpacity}
        imgOpacity={imgOpacity} setImgOpacity={setImgOpacity} imgLock={imgLock} setImgLock={setImgLock}
        imgdispMode={imgdispMode} setImgdispMode={setImgdispMode} panel={App.panel} />
      <div className="harmovis_area">
      <DeckGL
          views={new OrbitView({orbitAxis: 'Z', fov: 50})}
          viewState={viewState} controller={{scrollZoom:{smooth:true}}}
          onViewStateChange={v => updateViewState(v.viewState)}
          layers={[
              new LineLayer({
                id:'LineLayer',
                data: [
                  {sourcePosition:[100,100,0],targetPosition:[-100,100,0],color:[255,255,255,128]},
                  {sourcePosition:[100,0,0],targetPosition:[-100,0,0],color:[255,255,255,128]},
                  {sourcePosition:[100,-100,0],targetPosition:[-100,-100,0],color:[255,255,255,128]},
                  {sourcePosition:[100,100,0],targetPosition:[100,-100,0],color:[255,255,255,128]},
                  {sourcePosition:[0,100,0],targetPosition:[0,-100,0],color:[255,255,255,128]},
                  {sourcePosition:[-100,100,0],targetPosition:[-100,-100,0],color:[255,255,255,128]},
                ],
                coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
                getWidth: 1,
                widthMinPixels: 1,
                getColor: (x) => x.color || [255,255,255,255],
                opacity: opacity,
              }),
              getLayers(),
              getPathLayers(),
              new SimpleMeshLayer({
                id:'obj_1F',
                data:[{position:[0,0,0]}],
                mesh:obj_1F,
                coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
                getColor:[0,255,255,255],
                getOrientation:[0,-90,90],
                getTranslation:[75,0,-0.5],
                getScale:[1.7,1.7,1.7],
                opacity: opacity,
              }),
          ]}
      />
      </div>
      <div className="refArea">
        {getImgCanvas()}
      </div>
      <div className="harmovis_footer">
        target:{`[${viewState.target[0]},${viewState.target[1]},${viewState.target[2]}]`}&nbsp;
        rotationX:{viewState.rotationX}&nbsp;
        rotationOrbit:{viewState.rotationOrbit}&nbsp;
        zoom:{viewState.zoom}&nbsp;
      </div>
      <svg width={viewport.width} height={viewport.height} className="harmovis_overlay">
        <g fill="white" fontSize="12">
          {state.popup[2].length > 0 ?
            state.popup[2].split('\n').map((value, index) =>
              <text
                x={state.popup[0] + 10} y={state.popup[1] + (index * 12)}
                key={index.toString()}
              >{value}</text>) : null
          }
        </g>
      </svg>
      <LoadingIcon loading={loading} />
      <FpsDisplay />
    </Container>
  );
}
App.timeoutID = undefined
App.timeoutID2 = undefined
App.panel = true

export default connectToHarmowareVis(App);

const InitialFileRead = (props)=>{
  const { setImgList } = props;
  const request = new XMLHttpRequest();
  request.open('GET', 'data/sampledataNew.json');
  request.responseType = 'text';
  request.send();
  request.onload = function() {
    let readdata = null;
    try {
      readdata = JSON.parse(request.response);
    } catch (exception) {
      return;
    }
    console.log({readdata})
    setImgList(readdata)
  }
}
