import { useState } from 'react'

const PresentationForm = ({ createPresentation }) => {
    const [name, setName] = useState('')
    
    const addPresentation = (event) => {
        event.preventDefault()
        createPresentation({
        name: name,
        })
    
        setName('')
    }
    
    return (
        <div>
        <h2>Create new</h2>
        <form onSubmit={addPresentation}>
            <div>
            name
            <input
                id='name'
                value={name}
                onChange={({ target }) => setName(target.value)}
            />
            </div>
            <button id='create-button' type="submit">create</button>
        </form>
        </div>
    )
    }

export default PresentationForm
