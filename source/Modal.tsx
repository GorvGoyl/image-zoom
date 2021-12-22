import React, {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useClickAway, useEvent, usePrevious } from 'react-use'
import ICompress from './ICompress'
import getScaleToWindow from './getScaleToWindow'
import getScaleToWindowMax from './getScaleToWindowMax'

const SVG_REGEX = /\.svg$/i
const URL_REGEX = /url(?:\(['"]?)(.*?)(?:['"]?\))/

type ObjectFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'

export interface ModalProps {
  closeText:            string
  imgEl?:               HTMLImageElement
  isZoomed:             boolean
  modalLabelText:       string
  onClose:              () => void
  overlayBgColorEnd:    string
  overlayBgColorStart:  string
  transitionDuration:   number
  zoomMargin:           number
}

const Modal: FC<ModalProps> = ({
  closeText,
  imgEl,
  isZoomed,
  modalLabelText,
  onClose,
  overlayBgColorEnd,
  overlayBgColorStart,
  transitionDuration,
  zoomMargin,
}: ModalProps) => {
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement>()

  const refDialog    = useRef<HTMLDivElement>(null)
  const refImg       = useRef<HTMLImageElement>(null)
  const refBtnClose  = useRef<HTMLButtonElement>(null)
  const prevIsZoomed = usePrevious(isZoomed)

  const tabIndexBoundary = isZoomed ? 0 : undefined
  const tabIndexBtn      = isZoomed ? undefined : -1
  const tabIndexModal    = isZoomed ? -1 : undefined

  const imgRect = imgEl?.getBoundingClientRect()

  const imgElComputedStyle = useMemo(() => {
    return imgEl ? window.getComputedStyle(imgEl) : undefined
  }, [imgEl])

  const imgSrc = useMemo(() => {
    const src = imgEl?.src

    if (src) {
      return src
    }

    const bgImg = imgElComputedStyle?.backgroundImage

    if (bgImg) {
      return URL_REGEX.exec(bgImg)?.[1]
    }
  }, [imgEl, imgElComputedStyle])

  const styleWrap: CSSProperties = isZoomed
    ? {
      transition: 'visibility 0s ease 0s',
      visibility: 'visible',
    }
    : {
      //transition: `visibility 0s ease ${transitionDuration}ms`,
      visibility: 'hidden',
    }

  const styleOverlay: CSSProperties = isZoomed
    ? {
      backgroundColor: overlayBgColorEnd,
      transitionDuration: `${transitionDuration}ms`,
    }
    : {
      backgroundColor: overlayBgColorStart,
      transitionDuration: `${transitionDuration}ms`,
      pointerEvents: 'none',
    }

  const styleModalImg: CSSProperties = useMemo(() => {
    if (!loadedImg || !imgEl || !imgRect) {
      return { position: 'absolute' }
    }

    const isSvgSrc = imgEl.src && SVG_REGEX.test(imgEl.src)

    const scale = !isSvgSrc && imgEl.naturalHeight && imgEl.naturalWidth
      ? getScaleToWindowMax(
        imgRect.width,
        imgEl.naturalWidth,
        imgRect.height,
        imgEl.naturalHeight,
        zoomMargin
      )
      : getScaleToWindow(imgRect.width, imgRect.height, zoomMargin)

    const style: CSSProperties = {
      position:            'absolute',
      top:                 imgRect.top + window.scrollY,
      left:                imgRect.left + window.scrollX,
      width:               imgRect.width * scale,
      height:              imgRect.height * scale,
      //objectFit:           imgElComputedStyle?.objectFit as ObjectFit,
      transform:           `scale(${1 / scale}) translate(0,0)`,
      transitionDuration:  `${transitionDuration}ms`,
      transformOrigin:     'top left',
      transitionProperty:  'transform',
      willChange:          'transform',
    }

    const objectFit = imgElComputedStyle?.objectFit

    if (objectFit === 'cover') {
      let coverHeight  = 0
      let coverWidth   = 0
      let imgScale     = 1
      const imgRatio   = loadedImg.width / loadedImg.height
      const coverRatio = imgRect.width / imgRect.height

      if (imgRatio > coverRatio) {
        coverHeight = imgRect.height
        imgScale = coverHeight / loadedImg.height
        coverWidth = imgScale * loadedImg.width
        style.height = coverHeight * scale
        style.width = coverWidth * scale
        console.log('first', style.width, style.height)
      } else {
        coverWidth = imgRect.width
        imgScale = coverWidth / loadedImg.width
        coverHeight = imgScale * loadedImg.height
        style.height = coverHeight * scale
        style.width = coverWidth * scale
        console.log('second', style.width, style.height)
      }
    } else if (objectFit === 'contain') {
      //w = img.width
      //h = img.height
      //var newW, newH
      //if(w > h){
      //    newW = $0.offsetWidth
      //    newH = h / w * newW
      //} else {
      //    newH = $0.offsetHeight
      //    newW = w / h * newH
      //}
    }


    //if (imgEl.tagName === 'DIV' && loadedImg) {
    //  const bgSize = imgElComputedStyle?.backgroundSize

    //  if (bgSize === 'cover') {
    //    let coverHeight  = 0
    //    let coverWidth   = 0
    //    let imgScale     = 1
    //    const imgRatio   = loadedImg.width / loadedImg.height
    //    const coverRatio = imgRect.width / imgRect.height

    //    if (imgRatio > coverRatio) {
    //      coverHeight = imgRect.height
    //      imgScale = coverHeight / loadedImg.height
    //      coverWidth = imgScale * loadedImg.width
    //      style.height = coverHeight * scale
    //      style.width = coverWidth * scale
    //      console.log('first', style.width, style.height)
    //    } else {
    //      coverWidth = imgRect.width
    //      imgScale = coverWidth / loadedImg.width
    //      coverHeight = imgScale * loadedImg.height
    //      style.height = coverHeight * scale
    //      style.width = coverWidth * scale
    //      console.log('second', style.width, style.height)
    //    }
    //  } else if (bgSize === 'contain') {
    //    //w = img.width
    //    //h = img.height
    //    //var newW, newH
    //    //if(w > h){
    //    //    newW = $0.offsetWidth
    //    //    newH = h / w * newW
    //    //} else {
    //    //    newH = $0.offsetHeight
    //    //    newW = w / h * newH
    //    //}
    //  }
    //}

    if (isZoomed) {
      const viewportX    = window.innerWidth  / 2
      const viewportY    = window.innerHeight / 2
      const childCenterX = imgRect.left + imgRect.width  * scale / 2
      const childCenterY = imgRect.top  + imgRect.height * scale / 2
      const translateX   = viewportX - childCenterX
      const translateY   = viewportY - childCenterY

      style.transform = `scale(1) translate(${translateX}px,${translateY}px)`
    }

    return style
  }, [
    imgEl,
    imgElComputedStyle,
    imgRect,
    isZoomed,
    loadedImg,
    transitionDuration,
    zoomMargin,
  ])

  const handleFocusBoundary = useCallback(() => {
    refBtnClose.current?.focus({ preventScroll: true })
  }, [])

  const handleClickTrigger = useCallback(() => {
    if (isZoomed) {
      onClose()
    }
  }, [isZoomed, onClose])

  const handleKeyDown = useCallback(e => {
    if (isZoomed && e.key === 'Escape' || e.keyCode === 27) {
      e.stopPropagation()
      onClose()
    }
  }, [isZoomed, onClose])

  useEffect(() => {
    if (!imgEl) {
      return
    }

    if (!prevIsZoomed && isZoomed) {
      imgEl.style.visibility = 'hidden'
    } else if (prevIsZoomed && !isZoomed) {
      window.setTimeout(() => {
        imgEl.style.visibility = ''
      }, Math.max(transitionDuration - 50, 0))
    }
  }, [imgEl, isZoomed, prevIsZoomed, transitionDuration])

  useLayoutEffect(() => {
    if (!prevIsZoomed && isZoomed) {
      refBtnClose.current?.focus({ preventScroll: true })
      window.addEventListener('scroll', onClose, { capture: false, passive: true })
    }

    return () => {
      window.removeEventListener('scroll', onClose)
    }
  }, [isZoomed, onClose, prevIsZoomed])

  useEvent('click', handleClickTrigger, refImg.current)
  useEvent('keydown', handleKeyDown, document)
  useClickAway(refDialog, onClose)

  useEffect(() => {
    if (imgSrc) {
      const img = new Image()
      img.src = imgSrc
      img.onload = () => {
        setLoadedImg(img)
      }
    }
  }, [imgSrc])

  return (
    <div data-rmiz-portal-content style={styleWrap}>
      <div data-rmiz-overlay style={styleOverlay} />
      <div onFocus={handleFocusBoundary} tabIndex={tabIndexBoundary} />
      <div
        aria-label={modalLabelText}
        aria-modal="true"
        data-rmiz-modal
        ref={refDialog}
        role="dialog"
        tabIndex={tabIndexModal}
      >
        <button
          aria-label={closeText}
          data-rmiz-btn-close
          onClick={handleClickTrigger}
          ref={refBtnClose}
          tabIndex={tabIndexBtn}
          type="button"
        >
          <ICompress />
        </button>
        <img
          alt={imgEl?.alt}
          data-rmiz-modal-img
          ref={refImg}
          sizes={imgEl?.sizes}
          src={imgSrc}
          srcSet={imgEl?.srcset}
          style={styleModalImg}
        />
      </div>
      <div onFocus={handleFocusBoundary} tabIndex={tabIndexBoundary} />
    </div>
  )
}

export default Modal
