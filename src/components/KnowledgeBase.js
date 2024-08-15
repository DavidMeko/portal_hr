import React, { useState, useEffect, useCallback } from 'react';
import { styled, alpha, useTheme } from '@mui/material/styles';
import { animated, useSpring } from '@react-spring/web';
import clsx from 'clsx';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ArticleIcon from '@mui/icons-material/Article';
import FolderRounded from '@mui/icons-material/FolderRounded';
import CircularProgress from '@mui/material/CircularProgress';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { DataGrid } from '@mui/x-data-grid';
import { treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { unstable_useTreeItem2 as useTreeItem2 } from '@mui/x-tree-view/useTreeItem2';
import {
  TreeItem2Checkbox,
  TreeItem2Content,
  TreeItem2IconContainer,
  TreeItem2Label,
  TreeItem2Root,
} from '@mui/x-tree-view/TreeItem2';
import { TreeItem2Icon } from '@mui/x-tree-view/TreeItem2Icon';
import { TreeItem2Provider } from '@mui/x-tree-view/TreeItem2Provider';
import { TreeItem2DragAndDropOverlay } from '@mui/x-tree-view/TreeItem2DragAndDropOverlay';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

const StyledTreeItemRoot = styled(TreeItem2Root)(({ theme }) => ({
  color: theme.palette.text.secondary,
  position: 'relative',
  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: theme.spacing(3.5),
  },
}));

const CustomTreeItemContent = styled(TreeItem2Content)(({ theme }) => ({
  flexDirection: 'row-reverse',
  borderRadius: theme.spacing(0.7),
  marginBottom: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  paddingRight: theme.spacing(1),
  fontWeight: 500,
  [`&.Mui-expanded `]: {
    '&:not(.Mui-focused, .Mui-selected, .Mui-selected.Mui-focused) .labelIcon': {
      color: theme.palette.primary.main,
    },
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
  },
  [`&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

const AnimatedCollapse = animated(Collapse);

function TransitionComponent(props) {
  const style = useSpring({
    to: {
      opacity: props.in ? 1 : 0,
      transform: `translate3d(0,${props.in ? 0 : 20}px,0)`,
    },
  });

  return <AnimatedCollapse style={style} {...props} />;
}

const StyledTreeItemLabelText = styled(Typography)({
  fontWeight: 'inherit',
  flexGrow: 1,
});

const CustomLabel = ({ icon: Icon, children, isEditing, onRename, onCancelRename, ...other }) => {
  const [editedName, setEditedName] = useState(children);

  useEffect(() => {
    setEditedName(children);
  }, [children]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onRename(editedName);
    } else if (e.key === 'Escape') {
      onCancelRename();
    }
  };

  if (isEditing) {
    return (
      <TextField
        value={editedName}
        onChange={(e) => setEditedName(e.target.value)}
        onKeyDown={handleKeyDown}
        size="small"
        fullWidth
        autoFocus
        variant="outlined"
        InputProps={{
          style: {
            fontSize: 'inherit',
            fontWeight: 'inherit',
            padding: 0,
          },
        }}
      />
    );
  }

  return (
    <TreeItem2Label
      {...other}
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {Icon && (
        <Box
          component={Icon}
          className="labelIcon"
          color="inherit"
          sx={{ mr: 1, fontSize: '1.2rem' }}
        />
      )}
      <StyledTreeItemLabelText variant="body2">{children}</StyledTreeItemLabelText>
    </TreeItem2Label>
  );
};

const CustomTreeItem = React.forwardRef(function CustomTreeItem(props, ref) {
  const {
    id,
    itemId,
    label,
    children,
    onContextMenu,
    onItemSelect,
    onRename,
    onCancelRename,
    isEditing,
    ...other
  } = props;

  const {
    getRootProps,
    getContentProps,
    getIconContainerProps,
    getCheckboxProps,
    getLabelProps,
    getGroupTransitionProps,
    getDragAndDropOverlayProps,
    status,
    publicAPI,
  } = useTreeItem2({ id: itemId, itemId, children, label, ...other, rootRef: ref });

  const item = publicAPI.getItem(itemId);
  const expandable = item && item.children && item.children.length > 0;
  let icon = expandable ? FolderRounded : ArticleIcon;

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    onContextMenu(event, itemId);
  }, [onContextMenu, itemId]);

  const handleClick = useCallback((event) => {
    onItemSelect(event, itemId);
  }, [onItemSelect, itemId]);

  return (
    <TreeItem2Provider itemId={itemId}>
      <StyledTreeItemRoot 
        {...getRootProps(other)} 
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        <CustomTreeItemContent
          {...getContentProps({
            className: clsx('content', {
              'Mui-expanded': status.expanded,
              'Mui-selected': status.selected,
              'Mui-focused': status.focused,
              'Mui-disabled': status.disabled,
            }),
          })}
        >
          <TreeItem2IconContainer {...getIconContainerProps()}>
            <TreeItem2Icon status={status} />
          </TreeItem2IconContainer>
          <TreeItem2Checkbox {...getCheckboxProps()} />
          <CustomLabel 
            {...getLabelProps({ icon })} 
            isEditing={isEditing} 
            onRename={(newName) => onRename(itemId, newName)}
            onCancelRename={() => onCancelRename(itemId)}
          >
            {label}
          </CustomLabel>
          <TreeItem2DragAndDropOverlay {...getDragAndDropOverlayProps()} />
        </CustomTreeItemContent>
        {children && <TransitionComponent {...getGroupTransitionProps()} />}
      </StyledTreeItemRoot>
    </TreeItem2Provider>
  );
});

const KnowledgeBase = () => {
  const [fileStructure, setFileStructure] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFileStructure();
  }, []);

  const fetchFileStructure = async () => {
    try {
      const result = await window.electron.knowledgeBase.getFileStructure();
      if (result.success) {
        const structureWithIds = addIdsToStructure(result.structure);
        setFileStructure(structureWithIds);
      } else {
        console.error('Error fetching file structure:', result.error);
      }
    } catch (error) {
      console.error('Error fetching file structure:', error);
    }
  };

  const addIdsToStructure = (items) => {
    return items.map(item => ({
      ...item,
      id: item.path,
      itemId: item.path,
      label: item.name,
      children: item.children ? addIdsToStructure(item.children) : undefined
    }));
  };

  const handleNodeSelect = async (event, nodeId) => {
    const node = findNodeById(fileStructure, nodeId);
    setSelectedNode(node);
    if (node && node.type === 'file') {
      setSelectedFile(node);
      setIsLoading(true);
      try {
        const result = await window.electron.knowledgeBase.getFileContent(node.path);
        if (result.success) {
          setFileContent(result.content);
          setFileType(result.fileType);
        } else {
          setFileContent('Error loading file content');
          setFileType(null);
        }
      } catch (error) {
        console.error('Error fetching file content:', error);
        setFileContent('Error loading file content');
        setFileType(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSelectedFile(null);
      setFileContent(null);
      setFileType(null);
    }
  };

  const findNodeById = (nodes, id) => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const foundNode = findNodeById(node.children, id);
        if (foundNode) return foundNode;
      }
    }
    return null;
  };

  const handleContextMenu = useCallback((event, nodeId) => {
    event.preventDefault();
    event.stopPropagation();
    const node = nodeId ? findNodeById(fileStructure, nodeId) : null;
    setSelectedNode(node);
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null,
    );
  }, [fileStructure, contextMenu]);

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleMenuAction = (action) => {
    if (action === 'rename' && selectedNode) {
      setEditingNodeId(selectedNode.path);
    } else if (action === 'delete' && selectedNode) {
      setDeleteConfirmOpen(true);
    } else {
      handleCreateItem(action === 'newFolder');
    }
    handleCloseContextMenu();
  };

  const handleCreateItem = async (isFolder) => {
    const parentPath = selectedNode ? selectedNode.path : '';
    const newItemName = isFolder ? 'New Folder' : 'New File';
    try {
      const result = await window.electron.knowledgeBase.addItem({
        parentPath,
        name: newItemName,
        isFolder,
      });
      if (result.success) {
        fetchFileStructure();
      } else {
        console.error('Error creating item:', result.error);
      }
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleDeleteItem = async () => {
    if (selectedNode) {
      try {
        const result = await window.electron.knowledgeBase.deleteItem(selectedNode.path);
        if (result.success) {
          fetchFileStructure();
          if (selectedFile && selectedFile.path === selectedNode.path) {
            setSelectedFile(null);
            setFileContent(null);
            setFileType(null);
          }
        } else {
          console.error('Error deleting item:', result.error);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
    setDeleteConfirmOpen(false);
  };

  const handleRenameItem = async (itemId, newName) => {
    const node = findNodeById(fileStructure, itemId);
    if (node) {
      try {
        const result = await window.electron.knowledgeBase.renameItem(node.path, newName);
        if (result.success) {
          fetchFileStructure();
          setEditingNodeId(null);
        } else {
          console.error('Error renaming item:', result.error);
        }
      } catch (error) {
        console.error('Error renaming item:', error);
      }
    }
  };

  const handleCancelRename = (itemId) => {
    setEditingNodeId(null);
  };

  const renderFileContent = () => {
    if (isLoading) {
      return <CircularProgress />;
    }

    if (!fileContent) return null;

    switch (fileType) {
      case 'xlsx':
      case 'xls':
        return fileContent.map((sheet, sheetIndex) => (
          <Box key={sheetIndex} sx={{ height: 'calc(90vh - 200px)', width: '100%', mb: 2 }}>
            <Typography variant="h6">{sheet.name}</Typography>
            <DataGrid
              rows={sheet.data.slice(1).map((row, index) => ({ id: index, ...row.reduce((acc, cell, i) => ({ ...acc, [`col${i}`]: cell }), {}) }))}
              columns={sheet.data[0].map((header, index) => ({ field: `col${index}`, headerName: header || `Column ${index + 1}`, flex: 1 }))}
              pageSize={100}
              rowsPerPageOptions={[100]}
              disableSelectionOnClick
              autoHeight
            />
          </Box>
        ));

      case 'pdf':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <img src={fileContent} alt="File content" style={{ maxWidth: '100%', maxHeight: '100%' }} />;

      default:
        return (
          <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {fileContent}
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Left side - File structure */}
      <Box sx={{ width: '300px', p: 2, borderRight: 1, borderColor: 'divider', overflowY: 'auto' }}>
        <RichTreeView
          items={fileStructure}
          defaultExpandedItems={['root']}
          sx={{ height: 'fit-content', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
          slots={{
            item: (props) => (
              <CustomTreeItem
                {...props}
                onContextMenu={handleContextMenu}
                onItemSelect={handleNodeSelect}
                isEditing={editingNodeId === props.itemId}
                onRename={handleRenameItem}
                onCancelRename={handleCancelRename}
              />
            ),
          }}
        />
        <Menu
          open={contextMenu !== null}
          onClose={handleCloseContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={() => handleMenuAction('newFolder')}>New Folder</MenuItem>
          <MenuItem onClick={() => handleMenuAction('newFile')}>New File</MenuItem>
          {selectedNode && (
            <>
              <MenuItem onClick={() => handleMenuAction('rename')}>Rename</MenuItem>
              <MenuItem onClick={() => handleMenuAction('delete')}>Delete</MenuItem>
            </>
          )}
        </Menu>
      </Box>

      {/* Right side - Content area */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto', height: '95%' }}>
        <Typography variant="h5">Knowledge Base Content</Typography>
        {selectedFile ? (
          <>
            <Typography variant="h6">{selectedFile.name}</Typography>
            {renderFileContent()}
          </>
        ) : (
          <Typography variant="body1">
            Select a file from the tree view to display its content here.
          </Typography>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedNode?.name}"?
          </Typography>
          <Typography>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteItem} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KnowledgeBase;