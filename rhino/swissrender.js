/**
 *  Utility Functions
 */
var renderTrimpathFile = function(req, res, templatePath, data) {
    var istream = req.getResourceResolver().getResource(templatePath).adaptTo(java.lang.Class.forName("java.io.InputStream"));
    var contents = new String(new java.util.Scanner(istream).useDelimiter("\\A").next());
    res.getWriter().print(contents.process(data));
}

var getService = function(servname, bctx) {
    return bctx.getService(bctx.getServiceReference(servname));
}

/**
 *  View functions
 *  TODO: override a type of require('path/to/code.js") so we can put these 
 *  in different files. We need this to be able to look up paths in the Sling
 *  resource store, whether thats JCR or a FS Resource mounted thing.
 */
var simpleStringTemplate = function(req,res, bctx) {
    var template = "<html><body>My simple trimpath template ${hello}</body></html>";
    res.getWriter().print(template.process({hello:" says hello to you!"}));
}

var basicUserInfoDump = function(req,res, bctx) {
    buis = getService("org.sakaiproject.nakamura.api.user.BasicUserInfoService",bctx);
    repo = getService("org.sakaiproject.nakamura.api.lite.Repository",bctx);
    litesession = repo.login();
    authmgr = litesession.getAuthorizableManager();
    user = authmgr.findAuthorizable("admin");
    userprops = buis.getProperties(user);
    var renderData = {username:"admin",items:[],userdump:userprops};
    var elements = buis.getBasicProfileElements();
    for (var i = 0; i < elements.length; i++ ) {
        renderData.items.push({key:elements[i],value:userprops.get(elements[i])});
    }
    renderTrimpathFile(req, res, "/dev/rhino/basicuserinfo.html", renderData);    //buis.getBasicProfileElements()[1]});
}

var meRender = function(req,res,bctx) {
    renderTrimpathFile(req,res, "/dev/rhino/me.html", {seoStuff:"Please index this sweet data"});
}

/*
 * These URL Patterns show all the paths for the application that we handle.
 * Right now, we're hacking around them and passing them in as a parameter 
 * becuase I couldn't figure out how to get Sling to register them dynamically.
 * However this must be possible, because when you upload a /etc/map/map.json file
 * to sling those new paths get registered in the system dynamically. So whatever
 * hooks that uses we could use.  Ideally, we should listen for changes to this
 * file, and when urlpatterns is updated, these new paths should be registered 
 * with sling so they can be top level application URL's.  Right now the URLs for
 * these look like:
 *  http://localhost:8080/system/swissrender?t=/dev/simple
 * 
 * This is loosely inspired by the URL Patterns array in Django. If I had time I 
 * would have added in some of the cool regex support.
 */
var urlpatterns = [
    {path: "/dev/simple", op: simpleStringTemplate},
    {path: "/dev/basicuser", op: basicUserInfoDump},
    {path: "/me", op: meRender}
];


/**
 *  Main entry point for our server side javascript rendering
 */
var swissBootstrap = function(req,res,bctx) {
    var path = req.getParameter("t");
    for (var i = 0; i < urlpatterns.length; i++) {
        if (path == urlpatterns[i].path) {
            urlpatterns[i].op.apply(this,[req,res,bctx]);
            return;
        }
    }
    res.getWriter().println("Nothing to handle that path: " + path);
}

