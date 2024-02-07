import { useState } from 'react'

const PresentationForm = ({ createPresentation }) => {
    const [newPresentationName, setNewPresentationName] = useState("")

    const addPresentation = (event) => {
        event.preventDefault()
        createPresentation({
            name: newPresentationName
        })
        setNewPresentationName("")
    }

    return (
        <form onSubmit={addPresentation}>
            <div>
                name:
                <input
                id="name"
                value={newPresentationName}
                onChange={({ target }) => setNewPresentationName(target.value)}
                />
            </div>
            <button type="submit">create</button>
        </form>
    )
}

export default PresentationForm
