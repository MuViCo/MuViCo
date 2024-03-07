import { X } from "@mui/icons-material";
import React from "react"

const VideoInformationTable = () => {
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

    const tableData = [
        { id: 1, name: 'Tuote 1', link: "x" },
        { id: 2, name: 'Tuote 2', link: "xx" },
        { id: 3, name: 'Tuote 3', link: "xxx" },
      ];
    
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
            {tableData.map(item => (
              <tr key={item.id}>
                <td style={styles.td}>{item.id}</td>
                <td style={styles.td}>{item.name}</td>
                <td style={styles.td}>{item.link}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
}

export default VideoInformationTable