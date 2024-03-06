import { useState } from 'react'
import { FormControl, FormLabel, Input, Button, Box } from "@chakra-ui/react"

const ConnectionForm = () => {
    const [ipAddress, setIpAddress] = useState('');
    const [ips, setIps] = useState([]);

    const addConnection = (event) => {
        event.preventDefault();
        console.log('Creating connection:', ipAddress);
        setIps(ips.concat(ipAddress));
        window.localStorage.setItem('ips', JSON.stringify(ips));
        setIpAddress('');
    };

    return (
        <Box>
            <h2>Connections</h2>
            <div>
                {ips.map((ip, index) => (
                    <p key={index}>{ip}</p>
                ))}
            </div>
            <form onSubmit={addConnection}>
                <FormControl>
                    <FormLabel htmlFor='ipAddress'>IP Address</FormLabel>
                    <Input
                        id='ipAddress'
                        value={ipAddress}
                        onChange={({ target }) => setIpAddress(target.value)}
                    />
                </FormControl>
                <Button id='create-button' type="submit">Create Connection</Button>
            </form>
        </Box>
    );
};

export default ConnectionForm
