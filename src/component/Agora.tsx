import React, { useCallback, useEffect, useRef, useState } from 'react'
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, ICameraVideoTrack } from 'agora-rtc-sdk-ng'

const options = {
    // Pass your App ID here.
    appId: '',
    // Set the channel name.
    channel: '',
    // Pass your temp token here.
    token: '',
    // Set the user ID.
    uid: 123456
}

export function Agora() {
  const [client, setClient] = useState<IAgoraRTCClient>()
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack>()
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack>()
  const remotePlayerContainer = useRef<HTMLDivElement | null>(null)
  const localPlayerContainer = useRef<HTMLDivElement | null>(null)
  const handleMediaInfo = () => {
		navigator.mediaDevices.enumerateDevices()
			.then(function (devices) {
				devices.forEach(function (device) {
					console.log(`kind=${device.kind} label=${device.label} deviceId=${device.deviceId} groupId=${device.groupId}`)
				})
			})
			.catch(function (err) {
				console.log(err.name + ': ' + err.message)
			})
  }
  const handleGetUserMedia = () => {
		navigator.mediaDevices.getUserMedia({ audio: true, video: true })
			.then(function (stream) {
				const videoTracks = stream.getVideoTracks()
				console.log('Using video device: ' + videoTracks[0].label)
				stream.onremovetrack = function () {
					console.log('Stream ended')
				}
				window.stream = stream // make variable available to browser console
			})
			.catch(function (error) {
				console.log('error', error.name)
			})
  }
	const handleCreate = () => {
		if (client) {
			console.log('already client created')
		} else {
			const c = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' })
			setClient(c)
			console.log('client create!!!!')
		}
	}
	const handleGetCameras = () => {
		const getCameras = async () => {
			const cameras = await AgoraRTC.getCameras()
			if (cameras) {
				console.log('camera count = ' + cameras.length)
				console.log(JSON.stringify(cameras))
			} else {
				console.log('There is no cameras')
			}
		}
		getCameras()
	}
	const handleMicrophones = () => {
		const getMicrophones = async () => {
				const microphones = await AgoraRTC.getMicrophones()
				if (microphones) {
						console.log('microphones count = ' + microphones.length)
						console.log(JSON.stringify(microphones))
				} else {
						console.log('There is no microphones')
				}
		}
		getMicrophones()
	}
	const handleJoin = () => {
		console.log('handleJoin')
		if (client && localPlayerContainer.current) {
			console.log('handleJoin!!!!')
			const join = async () => {
				// Join an RTC channel.
				await client.join(options.appId, options.channel, options.token, options.uid)
				console.log('join')

				if (window.device && window.device.platform === 'iOS') {
					const devices = await navigator.mediaDevices.enumerateDevices()
					const cameraId = devices.find(d => d.kind.startsWith('video'))?.deviceId
					console.log('cameraId = ' + cameraId)
					const microphoneId = devices.find(d => d.kind.startsWith('audio'))?.deviceId
					console.log('audioId = ' + microphoneId)

					const videoTr = await AgoraRTC.createCameraVideoTrack({ cameraId })
					console.log('videoTr')
					const audioTr = await AgoraRTC.createMicrophoneAudioTrack({ microphoneId })
					console.log('audioTr')

					await client.publish([videoTr, audioTr])
					console.log('handleJoin publish')

					if (localPlayerContainer.current) {
						videoTr.play(localPlayerContainer.current)
						console.log('handleJoin play')
					}
				} else {
					// Create a local audio track from the audio sampled by a microphone.
					const audioTr = await AgoraRTC.createMicrophoneAudioTrack()
					// Create a local video track from the video captured by a camera.
					console.log('audioTr')
					const videoTr = await AgoraRTC.createCameraVideoTrack()
					console.log('videoTr')
					// Publish the local audio and video tracks to the RTC channel.
					await client.publish([videoTr, audioTr])
					console.log('handleJoin publish')

					// Play the local video track.
					// Pass the DIV container and the SDK dynamically creates a player in the container for playing the local video track.
					if (localPlayerContainer.current) {
						videoTr.play(localPlayerContainer.current)
						console.log('handleJoin play')
					}

					setLocalAudioTrack(audioTr)
					setLocalVideoTrack(videoTr)
				}
			}
			try {
				join()
				console.log('publish success!')
			} catch (e) {
				console.log('error', e)
			}
		}
	}

	const handleLeave = useCallback(() => {
		if (localVideoTrack) {
			localVideoTrack.close()
			console.log('handleLeave close localVideoTrack')
		}
		if (localAudioTrack) {
			localAudioTrack.close()
			console.log('handleLeave close localAudioTrack')
		}
		if (client) {
			console.log('handleLeave client leave')

			// Traverse all remote users.
			client.remoteUsers.forEach(user => {
					// Destroy the dynamically created DIV containers.
					// const playerContainer = document.getElementById(user.uid)
					// if (playerContainer) {
					//     playerContainer.remove()
					// }
			})

			// Leave the channel.
			client.leave()
			console.log('leave success!')
		}
	}, [client, localAudioTrack, localVideoTrack])

    useEffect(() => {
			try {
				if (client && remotePlayerContainer.current) {
					client.on('user-published', async (user, mediaType) => {
						// Subscribe to the remote user when the SDK triggers the "user-published" event
						await client.subscribe(user, mediaType)
						console.log('subscribe success')

						// If the remote user publishes a video track.
						if (mediaType === 'video') {
							// Get the RemoteVideoTrack object in the AgoraRTCRemoteUser object.
							const remoteVideoTrack = user.videoTrack
							// Dynamically create a container in the form of a DIV element for playing the remote video track.
							// const remotePlayerContainer = document.createElement('div')
							// // Specify the ID of the DIV container. You can use the uid of the remote user.
							// remotePlayerContainer.id = user.uid.toString()
							// remotePlayerContainer.textContent = 'Remote user ' + user.uid.toString()
							// remotePlayerContainer.style.width = '640px'
							// remotePlayerContainer.style.height = '480px'
							// document.body.append(c)

							// Play the remote video track.
							// Pass the DIV container and the SDK dynamically creates a player in the container for playing the remote video track.
							if (remoteVideoTrack && remotePlayerContainer.current) {
								remoteVideoTrack.play(remotePlayerContainer.current)
							}

							// Or just pass the ID of the DIV container.
							// remoteVideoTrack.play(playerContainer.id)
						}

						// If the remote user publishes an audio track.
						if (mediaType === 'audio') {
							// Get the RemoteAudioTrack object in the AgoraRTCRemoteUser object.
							const remoteAudioTrack = user.audioTrack
							// Play the remote audio track. No need to pass any DOM element.
							if (remoteAudioTrack) {
								remoteAudioTrack.play()
							}
						}

						// Listen for the "user-unpublished" event
						client.on('user-unpublished', user => {
							console.log('user-unpublished')
							// Get the dynamically created DIV container.
							// const remotePlayerContainer = document.getElementById(user.uid)
							// // Destroy the container.
							// remotePlayerContainer.remove()
						})
					})
					setClient(client)
				}
			} catch (e) {
					console.log('error', e)
			}
    }, [client, AgoraRTC, remotePlayerContainer])

    useEffect(() => {
			if (window.device) {
				if (window.device.platform === 'Android') {
					cordova.plugins.permissions.requestPermissions([
						cordova.plugins.permissions.CAMERA, cordova.plugins.permissions.RECORD_AUDIO, cordova.plugins.permissions.MODIFY_AUDIO_SETTINGS, cordova.plugins.permissions.WRITE_EXTERNAL_STORAGE
					], () => console.log('permissions success'), () => console.log('permissions error'))
				}
				if (window.device.platform === 'iOS') {
					// const { iosrtc } = cordova.plugins
					// // Connect 'iosrtc' plugin, only for iOS devices
					// iosrtc.registerGlobals()
					// // Use speaker audio output
					// iosrtc.selectAudioOutput('speaker')
					// // Request audio and/or camera permission if not requested yet
					// iosrtc.requestPermission(true, true, function (permissionApproved: any) {
					// 		console.log('requestPermission status: ', permissionApproved ? 'Approved' : 'Rejected')
					// })
					// // Refresh video element
					// window.addEventListener('orientationchange', () => iosrtc.refreshVideos())
					// window.addEventListener('scroll', () => iosrtc.refreshVideos())

					// window.audioinput.checkMicrophonePermission(function (hasPermission) {
					//     if (hasPermission) {
					//         console.log('We already have permission to record.')
					//     } else {
					//         // Ask the user for permission to access the microphone
					//         window.audioinput.getMicrophonePermission(function (hasPermission, message) {
					//             if (hasPermission) {
					//                 console.log('User granted us permission to record.')
					//             } else {
					//                 console.warn('User denied permission to record.')
					//             }
					//         })
					//     }
				}
			}
    }, [])

    return (
			<div>
				<h1>Agora TEST</h1>
				{client && <div>client loaded</div>}
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<button style={{ padding: '10px' }}onClick={handleMediaInfo}>navigator.mediaDevices.enumerateDevices</button>
					<button style={{ padding: '10px' }}onClick={handleGetUserMedia}>handleGetUserMedia</button>
					<button style={{ padding: '10px' }}onClick={handleCreate}>Create</button>
					<button style={{ padding: '10px' }}onClick={handleGetCameras}>getCameras</button>
					<button style={{ padding: '10px' }}onClick={handleMicrophones}>getMicrophones</button>
					<button style={{ padding: '10px' }}onClick={handleJoin}>Join</button>
					<button style={{ padding: '10px' }}onClick={handleLeave}>Leave</button>
				</div>
				<div>
					<h2>localPlayerContainer</h2>
					<div ref={localPlayerContainer} style={{ width: '640px', height: '480px' }} webkit-playsinline ></div>
				</div>
				<div>
					<h2>remotePlayerContainer</h2>
					<div ref={remotePlayerContainer} style={{ width: '640px', height: '480px' }} webkit-playsinline ></div>
				</div>
			</div>
    )
}
