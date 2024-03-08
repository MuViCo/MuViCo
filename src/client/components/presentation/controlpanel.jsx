import { X } from "@mui/icons-material";
import React from "react"

const VideoInformationTable = ({data}) => {
    console.log(data)
    const styles = {
        table: {
          width: '800px',
          height: '200px',
          borderCollapse: 'collapse',
        },
        th: {
          borderBottom: '1px solid black',
          border: '2px solid black',
        },
        td: {
          textAlign: 'center',
          border: '2px solid black',
        }
      };

    
    
      return (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Link</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ?( 
             <tr>
                <td style={styles.td}></td>
                <td style={styles.td}></td>
                <td style={styles.td}></td>
             </tr>
            ):(
            
            data.map(file => (
              <tr key={file.id}>
                <td style={styles.td}>{file.id}</td>
                <td style={styles.td}>{file.name}</td>
                <td style={styles.td}>{file.url}</td>
              </tr>
            )))}
          </tbody>
        </table>
      );
}

export default VideoInformationTable