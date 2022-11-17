import React, { useState } from 'react';
import DeckGL from '@deck.gl/react';
import { LineLayer, COORDINATE_SYSTEM, OrbitView, BitmapLayer } from 'deck.gl';
import {
  Container, connectToHarmowareVis, LoadingIcon, FpsDisplay
} from 'harmoware-vis';
import Controller from '../components';

//const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN; //Acquire Mapbox accesstoken
//const titleimg = '../../data/title.png';
//const titleimg2 = '../../data/title2.png';
//const imglist = [{src:titleimg2},{src:titleimg2},{src:titleimg2},{src:titleimg2},{src:titleimg2}]

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 0,
  rotationOrbit: 0,
  zoom: 2.5
};

const App = (props)=>{
  const [now, setNow] = React.useState(new Date())
  const [dispStart, setDispStart] = React.useState(false)
  const [imglist, setImgList] = React.useState([])

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
  const [imgIdIdx,setImgIdIdx] = useState(undefined)
  const [update, setUpdate] = useState([])
  const [size3d, setSize3d] = useState([])
  const [deg3d, setDeg3d] = useState([])
  const [pos3d, setPos3d] = useState([])
  const [aspect, setAspect] = useState([])

  const { actions, viewport, loading } = props;

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
      setImgIdIdx(undefined)
    }
  },[imgId])

  const getBounds = (size,deg,pos,aspect)=>{
    const r = Math.abs((size/2)/Math.sin(aspect[2]))
    const rotate_x = [
      [r*Math.cos((deg.z+aspect[0])*(Math.PI/180)),r*Math.sin((deg.z+aspect[0])*(Math.PI/180)),0],
      [r*Math.cos((deg.z+aspect[1])*(Math.PI/180)),r*Math.sin((deg.z+aspect[1])*(Math.PI/180)),0],
      [r*Math.cos((deg.z+aspect[2])*(Math.PI/180)),r*Math.sin((deg.z+aspect[2])*(Math.PI/180)),0],
      [r*Math.cos((deg.z+aspect[3])*(Math.PI/180)),r*Math.sin((deg.z+aspect[3])*(Math.PI/180)),0],
    ]
    const rotate_y = rotate_x.map((e)=>{
      return [e[0],e[1]*Math.cos((deg.x)*(Math.PI/180)),e[1]*Math.sin((deg.x)*(Math.PI/180))]
    })
    const r2 = rotate_y.map((e)=>Math.sqrt((e[0]**2)+(e[2]**2)))
    const deg2 = rotate_y.map((e)=>Math.atan2(e[0],e[2])*180/Math.PI)
    const rotate_z = rotate_y.map((e,i)=>{
      return [r2[i]*Math.sin((deg.y+deg2[i])*(Math.PI/180)),e[1],r2[i]*Math.cos((deg.y+deg2[i])*(Math.PI/180))]
    })
    return [
      [rotate_z[0][0]+pos.x,rotate_z[0][1]+pos.y,rotate_z[0][2]+pos.z],
      [rotate_z[1][0]+pos.x,rotate_z[1][1]+pos.y,rotate_z[1][2]+pos.z],
      [rotate_z[2][0]+pos.x,rotate_z[2][1]+pos.y,rotate_z[2][2]+pos.z],
      [rotate_z[3][0]+pos.x,rotate_z[3][1]+pos.y,rotate_z[3][2]+pos.z],
    ]
  }

  const initProc = ()=>{
    const workcanvasRef = []
    const workImgSize = []
    const workTrimmSize = []
    const workupdate = []
    const worksize3d = []
    const workdeg3d = []
    const workpos3d = []
    const workaspect = []
    for(let i=0; i<imglist.length; i=i+1){
      const img = imglist[i]
      const shift = i%10
      workImgSize.push({width:0,height:0})
      workTrimmSize.push(img.trim !== undefined ? img.trim : {x:0,y:0,width:0,height:0})
      workcanvasRef.push(undefined)
      workupdate.push(0)
      worksize3d.push(img.size !== undefined ? img.size : 20)
      workdeg3d.push(img.deg !== undefined ? img.deg : {x:0, y:0, z:0})
      workpos3d.push(img.pos !== undefined ? img.pos : {x:(shift*10-50), y:(shift*10-50), z:i*2})
      workaspect.push([0,0,0,0])
    }
    setCanvasRef(workcanvasRef)
    setImgSize(workImgSize)
    setImgDispSize(workImgSize)
    setTrimSize(workTrimmSize)
    setUpdate(workupdate)
    setSize3d(worksize3d)
    setDeg3d(workdeg3d)
    setPos3d(workpos3d)
    setAspect(workaspect)
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
    if(imglist.length > 0){
      setTimeout(()=>{setDispStart(true)},1500);
    }else{
      setDispStart(false)
    }
  },[imglist])

  React.useEffect(()=>{
    if(imgIdIdx === undefined){
      const workBounds = []
      const length = Math.min(size3d.length,deg3d.length,pos3d.length,aspect.length)
      for(let i=0; i<length; i=i+1){
        workBounds[i] = getBounds(size3d[i],deg3d[i],pos3d[i],aspect[i])
      }
      setBounds(workBounds)
    }else{
      const workBounds = [...bounds]
      workBounds[imgIdIdx] = getBounds(size3d[imgIdIdx],deg3d[imgIdIdx],pos3d[imgIdIdx],aspect[imgIdIdx])
      setBounds(workBounds)
    }
  },[imgIdIdx,size3d,deg3d,pos3d,aspect])

  React.useEffect(()=>{
    if(imgDispSize.every((el)=>el.width>0 && el.height>0)){
      return
    }
    const wkImgRef = document.getElementsByClassName('img_handler')
    const workImgSize = []
    const workImgDispSize = []
    const workTrimmSize = []
    const workaspect = []
    for(let i=0; i<wkImgRef.length; i=i+1){
      workImgSize.push({width:wkImgRef[i].naturalWidth,height:wkImgRef[i].naturalHeight})
      const deg = Math.atan2(wkImgRef[i].naturalHeight,wkImgRef[i].naturalWidth)*180/Math.PI
      workaspect.push([180+deg,180-deg,deg,360-deg])
      workImgDispSize.push({width:wkImgRef[i].clientWidth,height:wkImgRef[i].clientHeight})
      workTrimmSize.push({x:0,y:0,width:wkImgRef[i].naturalWidth,height:wkImgRef[i].naturalHeight})
    }
    setImgRef(wkImgRef)
    setImgSize(workImgSize)
    setImgDispSize(workImgDispSize)
    setAspect(workaspect)
    for(let i=0; i<imglist.length; i=i+1){
      if(imglist[i].trim !== undefined){
        workTrimmSize[i] = imglist[i].trim
      }
    }
    setTrimSize(workTrimmSize)
  },[now])

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
  },[now])

  React.useEffect(()=>{
    if(dispStart && imgRef.length > 0 && canvasRef.length > 0 && imgRef.length === canvasRef.length){
      if(imgIdIdx === undefined){
        for(let i=0; i<context.length; i=i+1){
          const {width:dspwidth,height:dspheight} = imgDispSize[i] !== undefined ? imgDispSize[i] : {width:0,height:0}
          const {x,y,width:trimwidth,height:trimheight} = trimSize[i]
          context[i].clearRect(0,0,dspwidth,dspheight)
          context[i].drawImage(imgRef[i], x, y, trimwidth, trimheight, x, y, trimwidth, trimheight)
        }
      }else{
        const {width:dspwidth,height:dspheight} = imgDispSize[imgIdIdx] !== undefined ? imgDispSize[imgIdIdx] : {width:0,height:0}
        const {x,y,width:trimwidth,height:trimheight} = trimSize[imgIdIdx]
        context[imgIdIdx].clearRect(0,0,dspwidth,dspheight)
        context[imgIdIdx].drawImage(imgRef[imgIdIdx], x, y, trimwidth, trimheight, x, y, trimwidth, trimheight)
      }
    }
  },[dispStart,imgDispSize,trimSize])

  const updateState = (updateData)=>{
    setState({...state, ...updateData})
  }

  const getLayers = ()=>{
    if(dispStart){
      return imglist.map((t,idx)=>{
        return new BitmapLayer({
          id: `BitmapLayer-${idx}-${update[idx]}`,
          image: canvasRef[idx],
          bounds: bounds[idx],
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          pickable: true,
          onClick,
        })
      })
    }
    return null
  }

  const getImgCanvas = ()=>{
    return imglist.map((element,idx)=>{
      const {width,height} = imgSize[idx] !== undefined ? imgSize[idx] : {width:0,height:0}
      const {width:dspwidth,height:dspheight} = imgDispSize[idx] !== undefined ? imgDispSize[idx] : {width:0,height:0}
      return(<div key={idx}>
        <img draggable={false} className='img_handler' src={element.src} width={`${width?width:dspwidth}px`} height={`${height?height:dspheight}px`}/>
        <canvas className='canvas_handler' width={`${dspwidth}px`} height={`${dspheight}px`} ></canvas>
      </div>)
    })
  }

  const onClick = (el)=>{
    if (el && el.layer) {
      console.log(`el.object.id:${el.layer.id}`)
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
      if(deg3d[idx].x !== 0 || deg3d[idx].y !== 0 || deg3d[idx].z !== 0){
        data.deg = deg3d[idx]
      }
      data.pos = pos3d[idx]
      return data
    })
  }

  return (
    <Container {...props}>
      <Controller {...props} updateViewState={updateViewState} viewState={viewState} setImgList={setImgList}
        imgId={imgId} setImgId={setImgId} imgIdIdx={imgIdIdx} imgSize={imgSize} getOutputData={getOutputData}
        size3d={size3d} setSize3d={setSize3d} deg3d={deg3d} setDeg3d={setDeg3d} pos3d={pos3d} setPos3d={setPos3d}
        trimSize={trimSize} setTrimSize={setTrimSize} update={update} setUpdate={setUpdate} />
      <div className="harmovis_area">
      <DeckGL
          views={new OrbitView({orbitAxis: 'z', fov: 50})}
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
                opacity: 1,
              }),
              getLayers()
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
export default connectToHarmowareVis(App);
