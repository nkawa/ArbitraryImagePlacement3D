import React, { useState,useMemo } from 'react';
import {PlacementInput} from './placement-input'
import {PlacementOutput} from './placement-output'

export default class Controller extends React.Component {
  constructor(props){
    super(props)
    this.divRef = React.createRef();
  }

  onClick(buttonType){
    const { viewState, updateViewState } = this.props;
    switch (buttonType) {
      case 'zoom-in': {
        updateViewState({...viewState, zoom:(viewState.zoom+0.25), transitionDuration: 100,})
        break
      }
      case 'zoom-out': {
        updateViewState({...viewState, zoom:(viewState.zoom-0.25), transitionDuration: 100,})
        break
      }
      case 'reset': {
        updateViewState({
          target: [0, 0, 0],
          rotationX: 45,
          rotationOrbit: 0,
          zoom: 3.0,
          transitionDuration: 200,
        })
        break
      }
    }
  }

  componentDidUpdate(prevProps){
    if(prevProps.panel !== this.props.panel){
      this.divRef.current.hidden = !this.props.panel
    }
  }

  onChangeOpacity(e){
    const opacity = +e.target.value
    this.props.setOpacity(opacity)
  }

  onChangeSelect(e){
    const imgIdIdx = +e.target.value
    this.props.setImgId(`BitmapLayer-${imgIdIdx}-${this.props.update[imgIdIdx]}`)
  }

  render() {
    const {setImgList, getOutputData, imgIdIdx, srclist, opacity } = this.props
    return (
        <div className="harmovis_controller" ref={this.divRef} >
            <div className='panel'><PlacementInput setImgList={setImgList}/></div>
            <div className='panel'><PlacementOutput getOutputData={getOutputData}/></div>
            <ul className="flex_list">
            <li className="flex_row">
              <button onClick={this.onClick.bind(this,'zoom-in')} className='harmovis_button'>＋</button>
              <button onClick={this.onClick.bind(this,'zoom-out')} className='harmovis_button'>－</button>
              <button onClick={this.onClick.bind(this,'reset')} className='harmovis_button'>RESET</button>
            </li>
            <li className="flex_row">
              <label htmlFor="opacity">{`opacity :`}</label>
              <input type="range" value={opacity}
                min={0} max={1} step={0.1}
                onChange={this.onChangeOpacity.bind(this)}
                className="harmovis_input_range" id="opacity" />:
              <input type="number" value={opacity}
                min={0} max={1} step={0.1}
                onChange={this.onChangeOpacity.bind(this)}
                className="harmovis_input_number" id="opacity" />
            </li>
            </ul>
            <div className='panel'>
              <select className='local_select' value={imgIdIdx} onChange={this.onChangeSelect.bind(this)}>
              <option value="-1">select img</option>
              {srclist.map((x,i)=><option value={i} key={i}>{x}</option>)}
              </select>
            </div>
            <TransformController {...this.props}/>
        </div>
    );
  }
}
const TransformController = (props)=>{
  const {imgId, setImgId, imgIdIdx, size3d, deg3d, pos3d, aspect, setAspect,
    imgSize, trimSize, setTrimSize, update, setUpdate, srclist, z_order } = props
  const [wkTrimSize, setWktrimSize] = useState([])

  React.useEffect(()=>{
    setWktrimSize(trimSize.map((e,i)=>{
      const {x,y,width,height} = e
      const {width:basewidth,height:baseheight} = imgSize[i]
      return {
        left:x,
        right:basewidth-x-width,
        width:width,
        top:y,
        bottom:baseheight-y-height,
        height:height
      }
    }))
  },[trimSize,imgSize])

  return (<>{imgId === null || imgIdIdx === -1 ? null:
    <ul className="flex_list">
      <li className="flex_row">Image Item Control</li>

      <Z_OrderController {...props} />

      <PositionController {...props} dim={'x'} />
      <PositionController {...props} dim={'y'} />
      <PositionController {...props} dim={'z'} />
      
      <DegreeController {...props} dim={'x'} />
      <DegreeController {...props} dim={'y'} />
      <DegreeController {...props} dim={'z'} />

      <SizeController {...props} />

      <TrimTopController {...props} wkTrimSize={wkTrimSize} />
      <TrimBottomController {...props} wkTrimSize={wkTrimSize} />
      <TrimLeftController {...props} wkTrimSize={wkTrimSize} />
      <TrimRightController {...props} wkTrimSize={wkTrimSize} />

      <ReleaseButton {...props}/>
    </ul>
    }</>
  )
}
const Z_OrderController = (props)=>{
  const { imgIdIdx, z_order } = props

  const setZ_order = (e)=>{
    const value = +e.target.value
    const wkz_order = [...z_order]
    wkz_order[imgIdIdx] = value
    props.setzOrder(wkz_order)
  }

  return (<>{useMemo(()=>
    <li className="flex_row">
      <label htmlFor="z_order">{`z_order :`}</label>
      <input type="number" value={z_order[imgIdIdx]}
        min={0} max={200} step={1}
        onChange={setZ_order}
        className="harmovis_input_number" id="z_order" />
    </li>
    ,[z_order,imgIdIdx])}</>
  )
}
const PositionController = (props)=>{
  const { imgIdIdx, pos3d, dim } = props

  const setPos3d = (e)=>{
    const value = +e.target.value
    const wkpos3d = [...pos3d]
    wkpos3d[imgIdIdx][dim] = value
    props.setPos3d(wkpos3d)
  }

  return (<>{useMemo(()=>
    <li className="flex_row">
      <label htmlFor={`pos_${dim}`}>{`pos_${dim} :`}</label>
      <input type="range" value={pos3d[imgIdIdx][dim]}
        min={-1000} max={1000} step={0.1}
        onChange={setPos3d}
        className="harmovis_input_range" id={`pos_${dim}`} />:
      <input type="number" value={pos3d[imgIdIdx][dim]}
        min={-1000} max={1000} step={0.1}
        onChange={setPos3d}
        className="harmovis_input_number" id={`pos_${dim}`} />
    </li>
    ,[pos3d[imgIdIdx][dim],imgIdIdx])}</>
  )
}
const DegreeController = (props)=>{
  const { imgIdIdx, deg3d, dim } = props

  const setDeg3d = (e)=>{
    const value = +e.target.value
    const wkdeg3d = [...deg3d]
    wkdeg3d[imgIdIdx][dim] = value
    props.setDeg3d(wkdeg3d)
  }

  return (<>{useMemo(()=>
    <li className="flex_row">
      <label htmlFor={`rotate_${dim}`}>{`rotate_${dim} :`}</label>
      <input type="range" value={deg3d[imgIdIdx][dim]}
        min={-180} max={180} step={1}
        onChange={setDeg3d}
        className="harmovis_input_range" id={`rotate_${dim}`} />:
      <input type="number" value={deg3d[imgIdIdx][dim]}
        min={-180} max={180} step={1}
        onChange={setDeg3d}
        className="harmovis_input_number" id={`rotate_${dim}`} />deg
    </li>
    ,[deg3d[imgIdIdx][dim],imgIdIdx])}</>
  )
}
const SizeController = (props)=>{
  const { imgIdIdx, size3d } = props

  const setSize3d = (e)=>{
    const value = +e.target.value
    const wksize3d = [...size3d]
    wksize3d[imgIdIdx] = value
    props.setSize3d(wksize3d)
  }

  return (<>{useMemo(()=>
    <li className="flex_row">
      <label htmlFor="size">{`size :`}</label>
      <input type="range" value={size3d[imgIdIdx]}
        min={0} max={100} step={0.1}
        onChange={setSize3d}
        className="harmovis_input_range" id="size" />:
      <input type="number" value={size3d[imgIdIdx]}
        min={0} max={100} step={0.1}
        onChange={setSize3d}
        className="harmovis_input_number" id="size" />
    </li>
    ,[size3d[imgIdIdx],imgIdIdx])}</>
  )
}
const TrimTopController = (props)=>{
  const { imgIdIdx, aspect, setAspect, imgSize, trimSize, setTrimSize, wkTrimSize } = props

  const onChangeTrimTop = (e)=>{
    const value = +e.target.value
    const reftrimSize = wkTrimSize[imgIdIdx]
    const setTrimmSize = [...trimSize]
    setTrimmSize[imgIdIdx] = {
      x:reftrimSize.left,
      y:value,
      width:reftrimSize.width,
      height:imgSize[imgIdIdx].height-value-reftrimSize.bottom,
    }
    setTrimSize(setTrimmSize)
    const workaspect = [...aspect]
    const deg = Math.atan2(setTrimmSize[imgIdIdx].height,setTrimmSize[imgIdIdx].width)*180/Math.PI
    workaspect[imgIdIdx] = [180+deg,180-deg,deg,360-deg]
    setAspect(workaspect)
  }

  return (<>{useMemo(()=>
    <li className="flex_row">
      <label htmlFor="trim_top">{`trim_top :`}</label>
      <input type="range" value={wkTrimSize[imgIdIdx].top}
        min={0} max={imgSize[imgIdIdx].height-wkTrimSize[imgIdIdx].bottom} step={1}
        onChange={onChangeTrimTop}
        className="harmovis_input_range" id="trim_top" />:
      <input type="number" value={wkTrimSize[imgIdIdx].top}
        min={0} max={imgSize[imgIdIdx].height-wkTrimSize[imgIdIdx].bottom} step={1}
        onChange={onChangeTrimTop}
        className="harmovis_input_number" id="trim_top" />px
    </li>
    ,[wkTrimSize[imgIdIdx].top,wkTrimSize[imgIdIdx].bottom,imgIdIdx,imgSize[imgIdIdx].height])}</>
  )
}
const TrimBottomController = (props)=>{
  const { imgIdIdx, aspect, setAspect, imgSize, trimSize, setTrimSize, wkTrimSize } = props

  const onChangeTrimBottom = (e)=>{
    const value = +e.target.value
    const reftrimSize = wkTrimSize[imgIdIdx]
    const setTrimmSize = [...trimSize]
    setTrimmSize[imgIdIdx] = {
      x:reftrimSize.left,
      y:reftrimSize.top,
      width:reftrimSize.width,
      height:imgSize[imgIdIdx].height-value-reftrimSize.top,
    }
    setTrimSize(setTrimmSize)
    const workaspect = [...aspect]
    const deg = Math.atan2(setTrimmSize[imgIdIdx].height,setTrimmSize[imgIdIdx].width)*180/Math.PI
    workaspect[imgIdIdx] = [180+deg,180-deg,deg,360-deg]
    setAspect(workaspect)
  }

  return (<>{useMemo(()=>
    <li className="flex_row">
      <label htmlFor="trim_bottom">{`trim_bottom :`}</label>
      <input type="range" value={wkTrimSize[imgIdIdx].bottom}
        min={0} max={imgSize[imgIdIdx].height-wkTrimSize[imgIdIdx].top} step={1}
        onChange={onChangeTrimBottom}
        className="harmovis_input_range" id="trim_bottom" />:
      <input type="number" value={wkTrimSize[imgIdIdx].bottom}
        min={0} max={imgSize[imgIdIdx].height-wkTrimSize[imgIdIdx].top} step={1}
        onChange={onChangeTrimBottom}
        className="harmovis_input_number" id="trim_bottom" />px
    </li>
    ,[wkTrimSize[imgIdIdx].top,wkTrimSize[imgIdIdx].bottom,imgIdIdx,imgSize[imgIdIdx].height])}</>
  )
}
const TrimLeftController = (props)=>{
  const { imgIdIdx, aspect, setAspect, imgSize, trimSize, setTrimSize, wkTrimSize } = props

  const onChangeTrimLeft = (e)=>{
    const value = +e.target.value
    const reftrimSize = wkTrimSize[imgIdIdx]
    const setTrimmSize = [...trimSize]
    setTrimmSize[imgIdIdx] = {
      x:value,
      y:reftrimSize.top,
      width:imgSize[imgIdIdx].width-value-reftrimSize.right,
      height:reftrimSize.height,
    }
    setTrimSize(setTrimmSize)
    const workaspect = [...aspect]
    const deg = Math.atan2(setTrimmSize[imgIdIdx].height,setTrimmSize[imgIdIdx].width)*180/Math.PI
    workaspect[imgIdIdx] = [180+deg,180-deg,deg,360-deg]
    setAspect(workaspect)
  }

  return (<>{useMemo(()=>
    <li className="flex_row">
      <label htmlFor="trim_left">{`trim_left :`}</label>
      <input type="range" value={wkTrimSize[imgIdIdx].left}
        min={0} max={imgSize[imgIdIdx].width-wkTrimSize[imgIdIdx].right} step={1}
        onChange={onChangeTrimLeft}
        className="harmovis_input_range" id="trim_left" />:
      <input type="number" value={wkTrimSize[imgIdIdx].left}
        min={0} max={imgSize[imgIdIdx].width-wkTrimSize[imgIdIdx].right} step={1}
        onChange={onChangeTrimLeft}
        className="harmovis_input_number" id="trim_left" />px
    </li>
    ,[wkTrimSize[imgIdIdx].left,wkTrimSize[imgIdIdx].right,imgIdIdx,imgSize[imgIdIdx].width])}</>
  )
}
const TrimRightController = (props)=>{
  const { imgIdIdx, aspect, setAspect, imgSize, trimSize, setTrimSize, wkTrimSize } = props

  const onChangeTrimRight = (e)=>{
    const value = +e.target.value
    const reftrimSize = wkTrimSize[imgIdIdx]
    const setTrimmSize = [...trimSize]
    setTrimmSize[imgIdIdx] = {
      x:reftrimSize.left,
      y:reftrimSize.top,
      width:imgSize[imgIdIdx].width-value-reftrimSize.left,
      height:reftrimSize.height,
    }
    setTrimSize(setTrimmSize)
    const workaspect = [...aspect]
    const deg = Math.atan2(setTrimmSize[imgIdIdx].height,setTrimmSize[imgIdIdx].width)*180/Math.PI
    workaspect[imgIdIdx] = [180+deg,180-deg,deg,360-deg]
    setAspect(workaspect)
  }

  return (<>{useMemo(()=>
    <li className="flex_row">
      <label htmlFor="trim_right">{`trim_right :`}</label>
      <input type="range" value={wkTrimSize[imgIdIdx].right}
        min={0} max={imgSize[imgIdIdx].width-wkTrimSize[imgIdIdx].left} step={1}
        onChange={onChangeTrimRight}
        className="harmovis_input_range" id="trim_right" />:
      <input type="number" value={wkTrimSize[imgIdIdx].right}
        min={0} max={imgSize[imgIdIdx].width-wkTrimSize[imgIdIdx].left} step={1}
        onChange={onChangeTrimRight}
        className="harmovis_input_number" id="trim_right" />px
    </li>
    ,[wkTrimSize[imgIdIdx].left,wkTrimSize[imgIdIdx].right,imgIdIdx,imgSize[imgIdIdx].width])}</>
  )
}
const ReleaseButton = (props)=>{
  const { setImgId } = props

  const onClick = ()=>{
    setImgId(null)
  }

  return (<>{useMemo(()=>
    <li className="flex_row">
      <button onClick={onClick} className='harmovis_button'>release</button>
    </li>
    )}</>
  )
}