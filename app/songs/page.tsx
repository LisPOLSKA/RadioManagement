import SongsList from '@/components/SongsList'
import React from 'react'

const songsPage = () => {
  return (
    <div className='flex flex-col gap-6 p-6'>
      <SongsList />
    </div>
  )
}

export default songsPage